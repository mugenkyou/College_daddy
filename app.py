from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
from utils.document_converter import DocumentConverter
import logging
import subprocess
import threading
import atexit

app = Flask(__name__, static_folder='assets', template_folder='pages')
CORS(app)

UPLOAD_ROOT = 'data/notes'
NOTES_JSON = 'data/notes-data.json'

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store watcher process
watcher_process = None

def start_file_watcher():
    """Start the file watcher in a separate process"""
    global watcher_process
    try:
        watcher_script = os.path.join('scripts', 'auto-update-watcher.js')
        watcher_process = subprocess.Popen(['node', watcher_script], 
                                         stdout=subprocess.PIPE, 
                                         stderr=subprocess.PIPE)
        logger.info("File watcher started successfully")
    except Exception as e:
        logger.error(f"Failed to start file watcher: {str(e)}")

def stop_file_watcher():
    """Stop the file watcher process"""
    global watcher_process
    if watcher_process:
        watcher_process.terminate()
        watcher_process.wait()
        logger.info("File watcher stopped")

# Register cleanup function
atexit.register(stop_file_watcher)

@app.route('/')
def home():
    """Serve homepage (index.html)"""
    return send_from_directory('.', 'index.html')

@app.route('/api/admin/upload', methods=['POST'])
def admin_upload():
    semester_id = request.form.get('semester')
    branch_id = request.form.get('branch')
    subject_id = request.form.get('subject')
    title = request.form.get('title')
    description = request.form.get('description')
    pdf = request.files.get('pdf')

    if not all([semester_id, branch_id, subject_id, title, description, pdf]):
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    # Load notes-data.json
    with open(NOTES_JSON, 'r', encoding='utf-8') as f:
        notes_data = json.load(f)

    # Find semester, branch, subject
    semester = next((s for s in notes_data['semesters'] if str(s['id']) == str(semester_id)), None)
    if not semester:
        return jsonify({'success': False, 'message': 'Semester not found.'}), 404
    branch = next((b for b in semester['branches'] if b['id'] == branch_id), None)
    if not branch:
        return jsonify({'success': False, 'message': 'Branch not found.'}), 404
    subject = next((sub for sub in branch['subjects'] if sub['id'] == subject_id), None)
    if not subject:
        return jsonify({'success': False, 'message': 'Subject not found.'}), 404

    # Handle file upload and conversion
    safe_filename = secure_filename(pdf.filename)
    folder_path = os.path.join(UPLOAD_ROOT, f'semester-{semester_id}', branch_id, subject['name'].replace(' ', '-').lower())
    os.makedirs(folder_path, exist_ok=True)
    
    file_extension = os.path.splitext(safe_filename)[1].lower()
    original_path = os.path.join(folder_path, safe_filename)
    pdf.save(original_path)
    
    # Convert to PDF if not already PDF
    conversion_message = ""
    if file_extension != '.pdf':
        if DocumentConverter.is_supported(file_extension):
            pdf_filename = DocumentConverter.get_converted_filename(safe_filename)
            pdf_path = os.path.join(folder_path, pdf_filename)
            
            success, converted_path, message = DocumentConverter.convert_to_pdf(original_path, pdf_path)
            if success:
                file_path = pdf_path
                conversion_message = f" (Converted from {file_extension.upper()} to PDF)"
                logger.info(f"Document converted: {original_path} -> {pdf_path}")
                # Delete original file after successful conversion
                os.remove(original_path)
                logger.info(f"Original file deleted: {original_path}")
                # Add converted file path to existing paths to prevent watcher duplicate
                rel_path_watcher = f"../{file_path.replace(os.path.sep, '/')}"
                if not any(m['path'] == rel_path_watcher for m in subject.get('materials', [])):
                    pass  # Will be added by admin upload logic below
            else:
                logger.error(f"Conversion failed: {message}")
                return jsonify({'success': False, 'message': f'Conversion failed: {message}'}), 500
        else:
            return jsonify({'success': False, 'message': f'Unsupported file format: {file_extension}'}), 400
    else:
        file_path = original_path

    # Thumbnail generation disabled

    # Update JSON
    rel_path = '/' + file_path.replace('\\', '/').replace(os.path.sep, '/')
    
    # Check for duplicates before adding
    rel_path_alt = f"..{rel_path[1:]}"
    existing_paths = [m['path'] for m in subject.get('materials', [])]
    if rel_path in existing_paths or rel_path_alt in existing_paths:
        return jsonify({'success': True, 'message': 'File already exists in database'}), 200
    
    material = {
        'title': title,
        'description': description,
        'path': rel_path,
        'type': 'pdf',
        'size': f"{os.path.getsize(file_path) // 1024}KB",
        'uploadDate': datetime.now().strftime('%Y-%m-%d'),
        'downloadUrl': f"/api/download?path={rel_path}"
    }
    subject.setdefault('materials', []).append(material)

    with open(NOTES_JSON, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False)

    return jsonify({
        'success': True, 
        'message': f'File uploaded and notes updated.{conversion_message}', 
        'converted': conversion_message != ""
    })

@app.route('/api/download')
def download():
    path = request.args.get('path')
    if not path or not os.path.isfile(path.lstrip('/')):
        return 'File not found', 404
    dir_name = os.path.dirname(path.lstrip('/'))
    file_name = os.path.basename(path)
    return send_from_directory(dir_name, file_name, as_attachment=True)

# Thumbnail endpoint removed - thumbnails disabled

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    return send_from_directory('pages', filename)

@app.route('/api/admin/delete-material', methods=['POST'])
def delete_material():
    """
    Delete a material (PDF) and its associated thumbnail
    """
    data = request.get_json()
    semester_id = data.get('semester')
    branch_id = data.get('branch')
    subject_id = data.get('subject')
    material_path = data.get('path')
    
    if not all([semester_id, branch_id, subject_id, material_path]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    try:
        # Load notes-data.json
        with open(NOTES_JSON, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
        
        # Find and remove material
        semester = next((s for s in notes_data['semesters'] if str(s['id']) == str(semester_id)), None)
        if not semester:
            return jsonify({'success': False, 'message': 'Semester not found'}), 404
        
        branch = next((b for b in semester['branches'] if b['id'] == branch_id), None)
        if not branch:
            return jsonify({'success': False, 'message': 'Branch not found'}), 404
        
        subject = next((sub for sub in branch['subjects'] if sub['id'] == subject_id), None)
        if not subject:
            return jsonify({'success': False, 'message': 'Subject not found'}), 404
        
        # Remove material from list
        original_count = len(subject.get('materials', []))
        subject['materials'] = [m for m in subject.get('materials', []) if m['path'] != material_path]
        
        if len(subject['materials']) == original_count:
            return jsonify({'success': False, 'message': 'Material not found'}), 404
        
        # Delete PDF file
        pdf_file_path = material_path.lstrip('/')
        if os.path.exists(pdf_file_path):
            os.remove(pdf_file_path)
            logger.info(f"PDF file deleted: {pdf_file_path}")
        
        # Update JSON
        with open(NOTES_JSON, 'w', encoding='utf-8') as f:
            json.dump(notes_data, f, indent=2, ensure_ascii=False)
        
        return jsonify({'success': True, 'message': 'Material deleted successfully'})
    
    except Exception as e:
        logger.error(f"Error deleting material: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

if __name__ == '__main__':
    # Start file watcher
    start_file_watcher()
    
    try:
        app.run(debug=True)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        stop_file_watcher()
