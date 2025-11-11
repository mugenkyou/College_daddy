import os
import logging
from pathlib import Path
import tempfile
import subprocess
import shutil
import platform

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
        com_initialized = False
        try:
            import pythoncom
            
            # Initialize COM for the current thread (required for docx2pdf on Windows)
            # This is needed because Flask runs each request in a different thread
            pythoncom.CoInitialize()
            com_initialized = True
            
            from docx2pdf import convert
            convert(str(input_path), str(output_path))
            return True, "DOCX converted successfully"
        except ImportError as e:
            return False, f"Required library not installed: {str(e)}"
        except Exception as e:
            return False, f"DOCX conversion failed: {str(e)}"
        finally:
            # Cleanup COM if we initialized it
            if com_initialized:
                try:
                    pythoncom.CoUninitialize()
                except Exception:
                    # Ignore cleanup errors
                    pass
    
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
    def _find_libreoffice():
        """Find LibreOffice soffice.exe in common installation locations"""
        # Common Windows installation paths
        windows_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            os.path.expanduser(r"~\AppData\Local\Programs\LibreOffice\program\soffice.exe"),
        ]
        
        # Check if running on Windows
        if platform.system() == 'Windows':
            for path in windows_paths:
                if os.path.exists(path):
                    return path
        else:
            # For Linux/Mac, try to find in PATH
            soffice_path = shutil.which('soffice')
            if soffice_path:
                return soffice_path
        
        # Try to find in PATH as last resort
        soffice_path = shutil.which('soffice')
        if soffice_path:
            return soffice_path
        
        return None
    
    @staticmethod
    def _convert_pptx_powerpoint_com(input_path, output_path):
        """Convert PPTX/PPT to PDF using PowerPoint COM automation (Windows only)"""
        com_initialized = False
        powerpoint = None
        presentation = None
        try:
            import pythoncom
            import win32com.client
            
            # Initialize COM for the current thread
            pythoncom.CoInitialize()
            com_initialized = True
            
            # Create PowerPoint application
            powerpoint = win32com.client.Dispatch("PowerPoint.Application")
            powerpoint.Visible = 1  # Set to 0 for headless, but 1 is more reliable
            
            # Open the presentation
            input_abs = os.path.abspath(str(input_path))
            output_abs = os.path.abspath(str(output_path))
            
            presentation = powerpoint.Presentations.Open(input_abs, WithWindow=False)
            
            # Export as PDF (format 32 = PDF)
            presentation.SaveAs(output_abs, 32)  # 32 = ppSaveAsPDF
            
            return True, "PPTX converted successfully using PowerPoint"
            
        except ImportError:
            return False, "win32com library not available. Install pywin32: pip install pywin32"
        except Exception as e:
            return False, f"PowerPoint COM conversion failed: {str(e)}"
        finally:
            # Clean up
            if presentation:
                try:
                    presentation.Close()
                except:
                    pass
            if powerpoint:
                try:
                    powerpoint.Quit()
                except:
                    pass
            if com_initialized:
                try:
                    pythoncom.CoUninitialize()
                except:
                    pass
    
    @staticmethod
    def _convert_pptx(input_path, output_path):
        """Convert PPTX/PPT to PDF using LibreOffice or PowerPoint COM"""
        # First try PowerPoint COM (Windows only, if PowerPoint is installed)
        if platform.system() == 'Windows':
            try:
                success, message = DocumentConverter._convert_pptx_powerpoint_com(input_path, output_path)
                if success:
                    return success, message
                # If PowerPoint COM fails, fall through to LibreOffice
            except Exception as e:
                logger.warning(f"PowerPoint COM conversion failed, trying LibreOffice: {str(e)}")
        
        # Try LibreOffice as fallback
        try:
            # Find LibreOffice executable
            soffice_path = DocumentConverter._find_libreoffice()
            
            if not soffice_path or not os.path.exists(soffice_path):
                return False, "Neither LibreOffice nor PowerPoint found. Please install LibreOffice (https://www.libreoffice.org/) or Microsoft PowerPoint."
            
            # LibreOffice outputs to the same directory with the same name but .pdf extension
            # We need to handle the output filename correctly
            expected_output = output_path.parent / (input_path.stem + '.pdf')
            
            result = subprocess.run([
                soffice_path, '--headless', '--convert-to', 'pdf', 
                '--outdir', str(output_path.parent), str(input_path)
            ], capture_output=True, text=True, timeout=60)
            
            # Check if conversion was successful
            if result.returncode == 0 and expected_output.exists():
                # Rename to the expected output path if different
                if expected_output != output_path:
                    expected_output.rename(output_path)
                return True, "PPTX converted successfully using LibreOffice"
            else:
                error_msg = result.stderr if result.stderr else result.stdout
                return False, f"LibreOffice conversion failed: {error_msg}"
                
        except FileNotFoundError:
            return False, "LibreOffice not found. Please install LibreOffice (https://www.libreoffice.org/)."
        except subprocess.TimeoutExpired:
            return False, "Conversion timeout (60 seconds exceeded)"
        except Exception as e:
            return False, f"PPTX conversion failed: {str(e)}"
    
    @staticmethod
    def get_converted_filename(original_filename):
        """Generate PDF filename from original filename"""
        return Path(original_filename).with_suffix('.pdf').name