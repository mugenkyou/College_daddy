import os
import logging
from pathlib import Path
import tempfile
import subprocess

logger = logging.getLogger(__name__)

class DocumentConverter:
    """Handles conversion of various document formats to PDF"""
    
    SUPPORTED_FORMATS = {
        '.docx': 'docx2pdf',
        '.doc': 'docx2pdf', 
        '.txt': 'text_to_pdf',
        '.pptx': 'unoconv',
        '.ppt': 'unoconv'
    }
    
    @staticmethod
    def is_supported(file_extension):
        """Check if file format is supported for conversion"""
        return file_extension.lower() in DocumentConverter.SUPPORTED_FORMATS
    
    @staticmethod
    def convert_to_pdf(input_path, output_path=None):
        """
        Convert document to PDF
        Returns: (success: bool, output_path: str, message: str)
        """
        try:
            input_path = Path(input_path)
            file_ext = input_path.suffix.lower()
            
            if not DocumentConverter.is_supported(file_ext):
                return False, None, f"Unsupported format: {file_ext}"
            
            if output_path is None:
                output_path = input_path.with_suffix('.pdf')
            else:
                output_path = Path(output_path)
            
            # Convert based on file type
            if file_ext in ['.docx', '.doc']:
                success, message = DocumentConverter._convert_docx(input_path, output_path)
            elif file_ext == '.txt':
                success, message = DocumentConverter._convert_txt(input_path, output_path)
            elif file_ext in ['.pptx', '.ppt']:
                success, message = DocumentConverter._convert_pptx(input_path, output_path)
            else:
                return False, None, f"No converter available for {file_ext}"
            
            if success:
                logger.info(f"Successfully converted {input_path} to {output_path}")
                return True, str(output_path), message
            else:
                logger.error(f"Failed to convert {input_path}: {message}")
                return False, None, message
                
        except Exception as e:
            logger.error(f"Error converting {input_path}: {str(e)}")
            return False, None, f"Conversion error: {str(e)}"
    
    @staticmethod
    def _convert_docx(input_path, output_path):
        """Convert DOCX/DOC to PDF using docx2pdf"""
        try:
            from docx2pdf import convert
            convert(str(input_path), str(output_path))
            return True, "DOCX converted successfully"
        except ImportError:
            return False, "docx2pdf library not installed"
        except Exception as e:
            return False, f"DOCX conversion failed: {str(e)}"
    
    @staticmethod
    def _convert_txt(input_path, output_path):
        """Convert TXT to PDF using reportlab"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            with open(input_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            c = canvas.Canvas(str(output_path), pagesize=letter)
            width, height = letter
            
            # Simple text rendering
            lines = content.split('\n')
            y = height - 50
            
            for line in lines:
                if y < 50:  # New page
                    c.showPage()
                    y = height - 50
                c.drawString(50, y, line[:80])  # Limit line length
                y -= 15
            
            c.save()
            return True, "TXT converted successfully"
        except ImportError:
            return False, "reportlab library not installed"
        except Exception as e:
            return False, f"TXT conversion failed: {str(e)}"
    
    @staticmethod
    def _convert_pptx(input_path, output_path):
        """Convert PPTX/PPT to PDF using LibreOffice"""
        try:
            # Use full LibreOffice path
            soffice_path = r"C:\Program Files\LibreOffice\program\soffice.exe"
            
            result = subprocess.run([
                soffice_path, '--headless', '--convert-to', 'pdf', 
                '--outdir', str(output_path.parent), str(input_path)
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return True, "PPTX converted successfully"
            else:
                return False, f"LibreOffice conversion failed: {result.stderr}"
                
        except FileNotFoundError:
            return False, "LibreOffice not found at expected path"
        except subprocess.TimeoutExpired:
            return False, "Conversion timeout"
        except Exception as e:
            return False, f"PPTX conversion failed: {str(e)}"
    
    @staticmethod
    def get_converted_filename(original_filename):
        """Generate PDF filename from original filename"""
        return Path(original_filename).with_suffix('.pdf').name