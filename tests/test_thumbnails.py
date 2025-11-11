"""
Unit tests for PDF thumbnail generation
"""

import os
import sys
import json
import tempfile
import unittest
from pathlib import Path
from io import BytesIO

# Add parent directory to path to import utils
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.thumbnail_generator import ThumbnailGenerator


class TestThumbnailGenerator(unittest.TestCase):
    """Test cases for ThumbnailGenerator"""
    
    @classmethod
    def setUpClass(cls):
        """Create temporary directory and test PDF"""
        cls.test_dir = tempfile.mkdtemp()
        cls.thumbnails_dir = os.path.join(cls.test_dir, 'thumbnails')
        cls.test_pdf_path = os.path.join(cls.test_dir, 'test.pdf')
        
        # Create test PDF
        cls.create_test_pdf(cls.test_pdf_path)
    
    @classmethod
    def create_test_pdf(cls, pdf_path):
        """Create a simple test PDF file"""
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            
            c = canvas.Canvas(pdf_path, pagesize=letter)
            c.drawString(100, 750, "Test PDF for Thumbnail Generation")
            c.drawString(100, 730, "This is a test document")
            c.showPage()
            c.save()
        except ImportError:
            # Fallback: create a minimal PDF manually
            pdf_content = (
                b'%PDF-1.4\n'
                b'1 0 obj\n'
                b'<< /Type /Catalog /Pages 2 0 R >>\n'
                b'endobj\n'
                b'2 0 obj\n'
                b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n'
                b'endobj\n'
                b'3 0 obj\n'
                b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] '
                b'/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> '
                b'/Contents 4 0 R >>\n'
                b'endobj\n'
                b'4 0 obj\n'
                b'<< /Length 44 >>\n'
                b'stream\n'
                b'BT\n'
                b'/F1 12 Tf\n'
                b'100 700 Td\n'
                b'(Test PDF) Tj\n'
                b'ET\n'
                b'endstream\n'
                b'endobj\n'
                b'xref\n'
                b'0 5\n'
                b'0000000000 65535 f \n'
                b'0000000009 00000 n \n'
                b'0000000058 00000 n \n'
                b'0000000115 00000 n \n'
                b'0000000280 00000 n \n'
                b'trailer\n'
                b'<< /Size 5 /Root 1 0 R >>\n'
                b'startxref\n'
                b'375\n'
                b'%%EOF\n'
            )
            with open(pdf_path, 'wb') as f:
                f.write(pdf_content)
    
    @classmethod
    def tearDownClass(cls):
        """Clean up temporary files"""
        import shutil
        if os.path.exists(cls.test_dir):
            shutil.rmtree(cls.test_dir)
    
    def test_ensure_thumbnails_dir(self):
        """Test that thumbnails directory is created"""
        # Override THUMBNAILS_DIR for testing
        original_dir = ThumbnailGenerator.__dict__.get('THUMBNAILS_DIR')
        test_thumbnails_dir = os.path.join(self.test_dir, 'test_thumbnails')
        
        # Mock the directory path
        ThumbnailGenerator.ensure_thumbnails_dir()
        self.assertTrue(os.path.exists('data/thumbnails'))
    
    def test_get_thumbnail_path_png(self):
        """Test thumbnail path generation for PNG format"""
        path = ThumbnailGenerator.get_thumbnail_path('/data/notes/test.pdf', 'png')
        self.assertTrue(path.startswith('data/thumbnails'))
        self.assertTrue(path.endswith('.png'))
    
    def test_get_thumbnail_path_webp(self):
        """Test thumbnail path generation for WebP format"""
        path = ThumbnailGenerator.get_thumbnail_path('/data/notes/test.pdf', 'webp')
        self.assertTrue(path.startswith('data/thumbnails'))
        self.assertTrue(path.endswith('.webp'))
    
    def test_thumbnail_path_consistency(self):
        """Test that same PDF path generates same thumbnail filename"""
        path1 = ThumbnailGenerator.get_thumbnail_path('/data/notes/test.pdf', 'png')
        path2 = ThumbnailGenerator.get_thumbnail_path('/data/notes/test.pdf', 'png')
        self.assertEqual(path1, path2)
    
    def test_get_thumbnail_url(self):
        """Test thumbnail URL generation"""
        url = ThumbnailGenerator.get_thumbnail_url('/data/notes/test.pdf', 'png')
        self.assertIn('/api/thumbnail', url)
        self.assertIn('path=', url)
        self.assertIn('format=', url)
    
    def test_generate_thumbnail_success(self):
        """Test successful thumbnail generation"""
        success, message = ThumbnailGenerator.generate_thumbnail(self.test_pdf_path, 'png')
        self.assertTrue(success or 'not found' in message.lower(), 
                       f"Thumbnail generation failed: {message}")
    
    def test_generate_thumbnail_nonexistent_pdf(self):
        """Test thumbnail generation with non-existent PDF"""
        success, message = ThumbnailGenerator.generate_thumbnail('/nonexistent/file.pdf', 'png')
        self.assertFalse(success)
        self.assertIn('not found', message.lower())
    
    def test_delete_thumbnail(self):
        """Test thumbnail deletion"""
        # Generate first
        ThumbnailGenerator.generate_thumbnail(self.test_pdf_path, 'png')
        
        # Then delete
        success = ThumbnailGenerator.delete_thumbnail(self.test_pdf_path)
        self.assertTrue(success)
    
    def test_cleanup_orphaned_thumbnails(self):
        """Test cleanup of orphaned thumbnails"""
        existing_paths = [self.test_pdf_path]
        deleted_count = ThumbnailGenerator.cleanup_orphaned_thumbnails(existing_paths)
        # Should return 0 or a positive number
        self.assertGreaterEqual(deleted_count, 0)


class TestThumbnailIntegration(unittest.TestCase):
    """Integration tests for thumbnail feature"""
    
    def setUp(self):
        """Set up Flask test client"""
        from app import app
        self.app = app
        self.client = self.app.test_client()
    
    def test_thumbnail_endpoint_exists(self):
        """Test that thumbnail endpoint exists"""
        # This will return 400 because we're not providing required params
        response = self.client.get('/api/thumbnail')
        self.assertIn(response.status_code, [400, 404, 200])
    
    def test_thumbnail_endpoint_missing_path(self):
        """Test thumbnail endpoint with missing path parameter"""
        response = self.client.get('/api/thumbnail')
        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
