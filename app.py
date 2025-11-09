"""
Flask application for College Daddy Notes Admin Panel.

- Provides REST API endpoints for uploading, organizing, and serving notes (PDFs) for different semesters, branches, and subjects.
- The /api/admin/upload endpoint allows admin users to upload new notes, which are saved to the filesystem and registered in notes-data.json.
- Supports secure file uploads, metadata management, and download endpoints for notes.
- Serves static assets and data for the frontend notes management/admin panel.
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_ROOT = 'data/notes'
NOTES_JSON = 'data/notes-data.json'

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

    # Save PDF
    safe_filename = secure_filename(pdf.filename)
    folder_path = os.path.join(UPLOAD_ROOT, f'semester-{semester_id}', branch_id, subject['name'].replace(' ', '-').lower())
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, safe_filename)
    pdf.save(file_path)

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

    with open(NOTES_JSON, 'w', encoding='utf-8') as f:
        json.dump(notes_data, f, indent=2, ensure_ascii=False)

    return jsonify({'success': True, 'message': 'PDF uploaded and notes updated.'})

@app.route('/api/download')
def download():
    path = request.args.get('path')
    if not path or not os.path.isfile(path.lstrip('/')):
        return 'File not found', 404
    dir_name = os.path.dirname(path.lstrip('/'))
    file_name = os.path.basename(path)
    return send_from_directory(dir_name, file_name, as_attachment=True)

@app.route('/pages/<path:filename>')
def serve_pages(filename):
    return send_from_directory('pages', filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)


@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    app.run(debug=True) 