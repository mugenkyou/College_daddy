"""
Flask application for College Daddy Notes Admin Panel.

- Provides REST API endpoints for uploading, organizing, and serving notes (PDFs) for different semesters, branches, and subjects.
- The /api/admin/upload endpoint allows admin users to upload new notes, which are saved to the filesystem and registered in notes-data.json.
- Supports secure file uploads, metadata management, and download endpoints for notes.
- Serves static assets and data for the frontend notes management/admin panel.
"""
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

# Configure logging for security events
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security.log'),
        logging.StreamHandler()
    ]
)

UPLOAD_ROOT = 'data/notes'
NOTES_JSON = 'data/notes-data.json'

# Security configurations
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    """Check if file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file):
    """Validate file size doesn't exceed maximum."""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset file pointer
    return size <= MAX_FILE_SIZE

def is_safe_path(basedir, path, follow_symlinks=True):
    """Prevent path traversal attacks."""
    if follow_symlinks:
        matchpath = os.path.realpath(path)
    else:
        matchpath = os.path.abspath(path)
    return basedir == os.path.commonpath((basedir, matchpath))

@app.route('/api/admin/upload', methods=['POST'])
def admin_upload():
    semester_id = request.form.get('semester')
    branch_id = request.form.get('branch')
    subject_id = request.form.get('subject')
    title = request.form.get('title')
    description = request.form.get('description')
    pdf = request.files.get('pdf')

    # Validate all required fields
    if not all([semester_id, branch_id, subject_id, title, description, pdf]):
        logging.warning('Upload attempt with missing fields')
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    # Validate file type
    if not allowed_file(pdf.filename):
        logging.warning(f'Invalid file type attempted: {pdf.filename}')
        return jsonify({'success': False, 'message': 'Only PDF files are allowed.'}), 400

    # Validate file size
    if not validate_file_size(pdf):
        logging.warning(f'File size exceeds limit: {pdf.filename}')
        return jsonify({'success': False, 'message': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024 * 1024)}MB.'}), 400

    # Sanitize filename
    safe_filename_str = secure_filename(pdf.filename)
    if not safe_filename_str:
        logging.warning('Invalid filename after sanitization')
        return jsonify({'success': False, 'message': 'Invalid filename.'}), 400

    # Load notes-data.json
    try:
        with open(NOTES_JSON, 'r', encoding='utf-8') as f:
            notes_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        logging.error(f'Error reading notes data: {str(e)}')
        return jsonify({'success': False, 'message': 'Error reading notes data.'}), 500

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

    # Create folder path with sanitized components
    folder_path = os.path.join(
        UPLOAD_ROOT, 
        f'semester-{semester_id}', 
        secure_filename(branch_id), 
        secure_filename(subject['name'].replace(' ', '-').lower())
    )
    
    # Verify path is within UPLOAD_ROOT (prevent path traversal)
    if not is_safe_path(os.path.abspath(UPLOAD_ROOT), os.path.abspath(folder_path)):
        logging.error(f'Path traversal attempt detected: {folder_path}')
        return jsonify({'success': False, 'message': 'Invalid path.'}), 400

    # Create directory and save file
    try:
        os.makedirs(folder_path, exist_ok=True)
        file_path = os.path.join(folder_path, safe_filename_str)
        pdf.save(file_path)
        logging.info(f'File uploaded successfully: {file_path}')
    except Exception as e:
        logging.error(f'Error saving file: {str(e)}')
        return jsonify({'success': False, 'message': 'Error saving file.'}), 500

    # Update JSON
    rel_path = '/' + file_path.replace('\\', '/').replace(os.path.sep, '/')
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

    try:
        with open(NOTES_JSON, 'w', encoding='utf-8') as f:
            json.dump(notes_data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logging.error(f'Error updating notes data: {str(e)}')
        return jsonify({'success': False, 'message': 'Error updating notes data.'}), 500

    return jsonify({'success': True, 'message': 'PDF uploaded and notes updated.'})

@app.route('/api/download')
def download():
    path = request.args.get('path')
    
    if not path:
        logging.warning('Download attempt without path')
        abort(400, 'Path parameter is required')
    
    # Remove leading slash and normalize path
    clean_path = path.lstrip('/')
    
    # Prevent path traversal
    if '..' in clean_path or clean_path.startswith('/'):
        logging.warning(f'Path traversal attempt detected: {path}')
        abort(403, 'Access denied')
    
    # Verify file exists and is within allowed directory
    full_path = os.path.abspath(clean_path)
    if not os.path.isfile(full_path):
        logging.warning(f'File not found: {path}')
        abort(404, 'File not found')
    
    # Verify path is within UPLOAD_ROOT
    if not is_safe_path(os.path.abspath(UPLOAD_ROOT), full_path):
        logging.error(f'Unauthorized file access attempt: {path}')
        abort(403, 'Access denied')
    
    # Verify file is PDF
    if not allowed_file(os.path.basename(full_path)):
        logging.warning(f'Attempt to download non-PDF file: {path}')
        abort(403, 'Only PDF files can be downloaded')
    
    dir_name = os.path.dirname(full_path)
    file_name = os.path.basename(full_path)
    
    logging.info(f'File downloaded: {path}')
    return send_from_directory(dir_name, file_name, as_attachment=True)

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    # Sanitize filename to prevent path traversal
    safe_name = secure_filename(filename)
    if safe_name != filename or '..' in filename:
        abort(403, 'Access denied')
    return send_from_directory('pages', safe_name)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    # Sanitize filename to prevent path traversal
    safe_name = secure_filename(filename)
    if safe_name != filename or '..' in filename:
        abort(403, 'Access denied')
    return send_from_directory('assets', safe_name)

@app.route('/data/<path:filename>')
def serve_data(filename):
    # Sanitize filename to prevent path traversal
    safe_name = secure_filename(filename)
    if safe_name != filename or '..' in filename:
        abort(403, 'Access denied')
    return send_from_directory('data', safe_name)

if __name__ == '__main__':
    app.run(debug=True)
