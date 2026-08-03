from flask import Flask, request, jsonify, send_from_directory, render_template, redirect
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
from utils.document_converter import DocumentConverter
import logging
import subprocess
import threading
import atexit
from utils.chatbot import PDFChatbot
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Threading lock to protect concurrent read-modify-write on notes-data.json
_notes_lock = threading.Lock()

app = Flask(__name__, static_folder='assets', template_folder='pages')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16 MB max upload size
CORS(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)

MAX_QUIZ_QUESTIONS = 20

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
# atexit.register(stop_file_watcher)

@app.route('/')
def home():
    """Redirect to admin panel by default"""
    return redirect('/pages/admin.html')

@app.route('/index.html')
def index():
    """Serve the main index.html page"""
    return send_from_directory('.', 'index.html')

@app.route('/api/admin/upload', methods=['POST'])
def admin_upload():
    semester_id = request.form.get('semester')
    branch_id = request.form.get('branch')
    subject_id = request.form.get('subject')
    title = request.form.get('title')
    description = request.form.get('description', '')  # Optional field, default to empty string
    pdf = request.files.get('pdf')

    if not all([semester_id, branch_id, subject_id, title, pdf]):
        return jsonify({'success': False, 'message': 'Missing required fields.'}), 400

    # Handle file upload and conversion first (outside lock for performance)
    safe_filename = secure_filename(pdf.filename)
    folder_path = os.path.join(UPLOAD_ROOT, f'semester-{semester_id}', branch_id)
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
                os.remove(original_path)
                logger.info(f"Original file deleted: {original_path}")
            else:
                logger.error(f"Conversion failed: {message}")
                return jsonify({'success': False, 'message': f'Conversion failed: {message}'}), 500
        else:
            return jsonify({'success': False, 'message': f'Unsupported file format: {file_extension}'}), 400
    else:
        file_path = original_path

    # Protect read-modify-write on notes-data.json with lock
    with _notes_lock:
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

        # Update subject folder path
        subject_folder = subject['name'].replace(' ', '-').lower()
        folder_path = os.path.join(UPLOAD_ROOT, f'semester-{semester_id}', branch_id, subject_folder)
        os.makedirs(folder_path, exist_ok=True)
        file_path = file_path.replace(os.path.join(UPLOAD_ROOT, f'semester-{semester_id}', branch_id), folder_path)

        # Update JSON
        rel_path = '/' + file_path.replace('\\', '/').replace(os.path.sep, '/')

        # Check for duplicates before adding
        rel_path_alt = f"..{rel_path[1:]}"
        existing_paths = {m['path'] for m in subject.get('materials', [])}
        if rel_path in existing_paths or rel_path_alt in existing_paths:
            return jsonify({'success': True, 'message': 'File already exists in database'}), 200

        # Get file size
        file_size_kb = os.path.getsize(file_path) // 1024

        material = {
            'title': title,
            'description': description,
            'path': rel_path,
            'type': 'pdf',
            'size': f"{file_size_kb}KB",
            'uploadDate': datetime.now().strftime('%Y-%m-%d'),
            'downloadUrl': f"/api/download?path={rel_path}"
        }
        subject.setdefault('materials', []).append(material)

        # Write JSON without indentation for faster writes (compact JSON)
        with open(NOTES_JSON, 'w', encoding='utf-8') as f:
            json.dump(notes_data, f, ensure_ascii=False, separators=(',', ':'))

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

@app.route('/api/chat/init', methods=['POST'])
def chat_init():
    data = request.get_json()
    pdf_path_req = data.get('path')
    
    if not pdf_path_req:
        return jsonify({'success': False, 'message': 'PDF path is required.'}), 400
        
    # Ensure it's a relative path from app root
    pdf_path = pdf_path_req.lstrip('/')
    
    if not os.path.exists(pdf_path):
        return jsonify({'success': False, 'message': f'PDF file not found: {pdf_path}'}), 404
        
    try:
        chatbot = PDFChatbot.get_instance(pdf_path)
        chatbot.initialize()
        return jsonify({'success': True, 'message': 'Chatbot initialized successfully.'})
    except Exception as e:
        logger.error(f"Chatbot init error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/chat/ask', methods=['POST'])
def chat_ask():
    data = request.get_json()
    pdf_path_req = data.get('path')
    question = data.get('question')
    
    if not pdf_path_req or not question:
        return jsonify({'success': False, 'message': 'Path and question are required.'}), 400
        
    pdf_path = pdf_path_req.lstrip('/')
    
    try:
        chatbot = PDFChatbot.get_instance(pdf_path)
        answer = chatbot.ask(question)
        return jsonify({'success': True, 'answer': answer})
    except Exception as e:
        logger.error(f"Chatbot ask error: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

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
        # Protect read-modify-write on notes-data.json with lock
        with _notes_lock:
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

            # Update JSON (use compact format for faster writes)
            with open(NOTES_JSON, 'w', encoding='utf-8') as f:
                json.dump(notes_data, f, ensure_ascii=False, separators=(',', ':'))

            return jsonify({'success': True, 'message': 'Material deleted successfully'})
    
    except Exception as e:
        logger.error(f"Error deleting material: {str(e)}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/api/quiz/generate', methods=['POST'])
@limiter.limit("10 per minute")
def generate_quiz():
    if request.is_json:
        data = request.get_json()
        topic = data.get('topic', 'General Knowledge')
        count = min(int(data.get('count', 5)), MAX_QUIZ_QUESTIONS)
        file = None
    else:
        topic = request.form.get('topic', 'General Knowledge')
        count = min(int(request.form.get('count', 5)), MAX_QUIZ_QUESTIONS)
        file = request.files.get('file')
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return jsonify({'success': False, 'message': 'GROQ_API_KEY is not set in environment.'}), 500
        
    try:
        client = Groq(api_key=api_key)
        
        context_text = ""
        if file:
            import PyPDF2
            if file.filename.endswith('.pdf'):
                try:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            context_text += page_text + "\n"
                    context_text = context_text[:15000]
                except Exception as e:
                    logger.error(f"Error reading PDF for quiz: {e}")
            elif file.filename.endswith('.txt'):
                try:
                    context_text = file.read().decode('utf-8')[:15000]
                except Exception as e:
                    logger.error(f"Error reading TXT for quiz: {e}")

        if context_text:
            prompt = f"""
            Generate a {count}-question multiple choice quiz strictly based on the following context document. 
            The general topic is "{topic}", but you must prioritize the content in the context document.
            Do not include information outside of the context.
            
            Context Document:
            {context_text}
            
            Return the result strictly as a valid JSON array of objects. Do not include any markdown formatting, backticks, or other text outside the JSON array.
            Each object must have the following exact structure:
            {{
                "question": "The question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,  // The integer index (0-3) of the correct option in the options array
                "explanation": "A short explanation of why the answer is correct based on the context document"
            }}
            """
        else:
            prompt = f"""
            Generate a {count}-question multiple choice quiz about "{topic}".
            Return the result strictly as a valid JSON array of objects. Do not include any markdown formatting, backticks, or other text outside the JSON array.
            Each object must have the following exact structure:
            {{
                "question": "The question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,  // The integer index (0-3) of the correct option in the options array
                "explanation": "A short explanation of why the answer is correct"
            }}
            """
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful quiz generator. Always respond with raw valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.5,
            max_tokens=1024,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        # In case the model still outputs markdown backticks, strip them
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        response_text = response_text.strip()
        
        quiz_data = json.loads(response_text)
        
        return jsonify({
            'success': True,
            'quiz': quiz_data
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Groq response as JSON: {response_text}")
        return jsonify({'success': False, 'message': 'Failed to generate a valid quiz format. Please try again.'}), 500
    except Exception as e:
        logger.error(f"Error generating quiz: {str(e)}")
        return jsonify({'success': False, 'message': f'Error generating quiz: {str(e)}'}), 500

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/data/<path:filename>')
def serve_data(filename):
    return send_from_directory('data', filename)

@app.route('/roadmap_assets/<path:filename>')
def serve_roadmap_assets(filename):
    return send_from_directory('roadmap_assets', filename)

if __name__ == '__main__':
    # Start file watcher only in the reloader process
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        start_file_watcher()
    
    try:
        app.run(debug=True)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        stop_file_watcher()
