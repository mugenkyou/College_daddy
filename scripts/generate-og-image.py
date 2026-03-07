#!/usr/bin/env python3
"""
Generate a 1200x630 PNG for og:image (Facebook, WhatsApp, etc. require PNG/JPEG, not SVG).
Run from project root: python scripts/generate-og-image.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 630
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "img", "college-daddy-og.png")

# Dark background (#0a0a0a to #181818)
img = Image.new("RGB", (W, H), color=(10, 10, 10))
draw = ImageDraw.Draw(img)

# Gradient-like fill (simplified: darker top, slightly lighter bottom)
for y in range(H):
    t = y / H
    r = int(10 + 8 * t)
    g, b = r, r
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Accent border (#009dff)
border = (0, 157, 255)
draw.rectangle([1, 1, W - 2, H - 2], outline=border, width=3)

# Try to use a nice font; fallback to default
try:
    font_large = ImageFont.truetype("arial.ttf", 72)
    font_mid = ImageFont.truetype("arial.ttf", 28)
    font_small = ImageFont.truetype("arial.ttf", 22)
except OSError:
    try:
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
        font_mid = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
    except OSError:
def text_center(d, x_center, y, text, font, fill):
    bbox = d.textbbox((0, 0), text, font=font) if hasattr(d, "textbbox") else d.textsize(text, font=font)
    tw = bbox[2] - bbox[0] if len(bbox) == 4 else bbox[0]
    d.text((x_center - tw // 2, y), text, fill=fill, font=font)

        font_large = ImageFont.load_default()
        font_mid = font_small = font_large

cx = W // 2
# Title: College Daddy (white)
draw.text((cx - 200, 220), "College Daddy", fill=(255, 255, 255), font=font_large)
# Subtitle (accent blue)
draw.text((cx - 280, 320), "Career Roadmaps  •  CGPA  •  Study Timer  •  Notes", fill=border, font=font_mid)
# Tagline (gray)
draw.text((cx - 220, 380), "Your ultimate companion for academic success", fill=(136, 136, 136), font=font_small)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
img.save(OUT, "PNG", optimize=True)
print(f"Saved: {OUT}")
