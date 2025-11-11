"""
PDF Thumbnail Generation Module
Handles automatic thumbnail generation, caching, and cleanup for uploaded PDFs
"""

import os
import hashlib
from pathlib import Path
from PIL import Image
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)

# Configuration
THUMBNAILS_DIR = 'data/thumbnails'
THUMBNAIL_WIDTH = 200
THUMBNAIL_HEIGHT = 280
THUMBNAIL_DPI = 150
CACHE_ENABLED = True


class ThumbnailGenerator:
    """Generate and manage PDF thumbnails"""
    
    @staticmethod
    def ensure_thumbnails_dir():
        """Create thumbnails directory if it doesn't exist"""
        Path(THUMBNAILS_DIR).mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def get_thumbnail_path(pdf_path: str, format: str = 'png') -> str:
        """
        Generate a unique thumbnail path based on PDF path
        
        Args:
            pdf_path: Path to the original PDF
            format: Output format ('png' or 'webp')
            
        Returns:
            Path to the thumbnail file
        """
        # Create a hash of the PDF path for unique filename
        path_hash = hashlib.md5(pdf_path.encode()).hexdigest()
        thumbnail_name = f"{path_hash}.{format}"
        return os.path.join(THUMBNAILS_DIR, thumbnail_name)
    
    @staticmethod
    def generate_thumbnail(pdf_path: str, output_format: str = 'png') -> tuple[bool, str]:
        """
        Generate thumbnail from PDF file
        
        Args:
            pdf_path: Full path to the PDF file
            output_format: Output format ('png' or 'webp')
            
        Returns:
            (success: bool, message: str)
        """
        try:
            # Check if PDF exists
            if not os.path.isfile(pdf_path):
                return False, f"PDF file not found: {pdf_path}"
            
            # Ensure thumbnails directory exists
            ThumbnailGenerator.ensure_thumbnails_dir()
            
            # Get thumbnail path
            thumbnail_path = ThumbnailGenerator.get_thumbnail_path(pdf_path, output_format)
            
            # Check if thumbnail already exists (cache)
            if os.path.exists(thumbnail_path) and CACHE_ENABLED:
                logger.info(f"Using cached thumbnail: {thumbnail_path}")
                return True, f"Thumbnail cached: {thumbnail_path}"
            
            # Open PDF and render first page
            try:
                pdf_doc = fitz.open(pdf_path)
                first_page = pdf_doc[0]
                
                # Render page to image with specified DPI
                pix = first_page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
                
                # Convert to PIL Image for resizing
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Resize to standard thumbnail size
                img.thumbnail((THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), Image.Resampling.LANCZOS)
                
                # Create a canvas with the exact size and paste the resized image
                thumbnail = Image.new('RGB', (THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), (255, 255, 255))
                offset = ((THUMBNAIL_WIDTH - img.width) // 2, (THUMBNAIL_HEIGHT - img.height) // 2)
                thumbnail.paste(img, offset)
                
                # Save thumbnail
                if output_format.lower() == 'webp':
                    thumbnail.save(thumbnail_path, 'WEBP', quality=80)
                else:
                    thumbnail.save(thumbnail_path, 'PNG', optimize=True)
                
                pdf_doc.close()
                logger.info(f"Thumbnail generated successfully: {thumbnail_path}")
                return True, f"Thumbnail generated: {thumbnail_path}"
                
            except Exception as e:
                logger.error(f"Error processing PDF {pdf_path}: {str(e)}")
                return False, f"Error processing PDF: {str(e)}"
                
        except Exception as e:
            logger.error(f"Unexpected error in generate_thumbnail: {str(e)}")
            return False, f"Unexpected error: {str(e)}"
    
    @staticmethod
    def delete_thumbnail(pdf_path: str) -> bool:
        """
        Delete thumbnail associated with a PDF
        
        Args:
            pdf_path: Path to the original PDF file
            
        Returns:
            True if deleted or didn't exist, False if error occurred
        """
        try:
            thumbnail_path_png = ThumbnailGenerator.get_thumbnail_path(pdf_path, 'png')
            thumbnail_path_webp = ThumbnailGenerator.get_thumbnail_path(pdf_path, 'webp')
            
            success = True
            for thumbnail_path in [thumbnail_path_png, thumbnail_path_webp]:
                if os.path.exists(thumbnail_path):
                    os.remove(thumbnail_path)
                    logger.info(f"Thumbnail deleted: {thumbnail_path}")
            
            return success
        except Exception as e:
            logger.error(f"Error deleting thumbnail for {pdf_path}: {str(e)}")
            return False
    
    @staticmethod
    def get_thumbnail_url(pdf_path: str, format: str = 'png') -> str:
        """
        Get the API URL for a thumbnail
        
        Args:
            pdf_path: Path to the original PDF
            format: Thumbnail format ('png' or 'webp')
            
        Returns:
            API endpoint URL for the thumbnail
        """
        thumbnail_path = ThumbnailGenerator.get_thumbnail_path(pdf_path, format)
        # Convert to relative path format for API
        return f"/api/thumbnail?path={pdf_path}&format={format}"
    
    @staticmethod
    def cleanup_orphaned_thumbnails(existing_pdf_paths: list) -> int:
        """
        Remove thumbnail files for PDFs that no longer exist
        
        Args:
            existing_pdf_paths: List of currently existing PDF paths
            
        Returns:
            Number of orphaned thumbnails deleted
        """
        try:
            if not os.path.exists(THUMBNAILS_DIR):
                return 0
            
            # Create a set of hash values for existing PDFs
            existing_hashes = set()
            for pdf_path in existing_pdf_paths:
                path_hash = hashlib.md5(pdf_path.encode()).hexdigest()
                existing_hashes.add(path_hash)
            
            # Find and delete orphaned thumbnails
            deleted_count = 0
            for filename in os.listdir(THUMBNAILS_DIR):
                file_hash = os.path.splitext(filename)[0]
                if file_hash not in existing_hashes:
                    try:
                        os.remove(os.path.join(THUMBNAILS_DIR, filename))
                        deleted_count += 1
                        logger.info(f"Orphaned thumbnail deleted: {filename}")
                    except Exception as e:
                        logger.error(f"Error deleting orphaned thumbnail {filename}: {str(e)}")
            
            return deleted_count
        except Exception as e:
            logger.error(f"Error in cleanup_orphaned_thumbnails: {str(e)}")
            return 0
