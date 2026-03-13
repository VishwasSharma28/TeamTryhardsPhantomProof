import sys
from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), color=(13, 17, 32, 255)) # --bg-panel #0d1120
    draw = ImageDraw.Draw(img)
    
    # Shield drawing
    w, h = size, size
    padding = size * 0.15
    
    # shield points
    points = [
        (w/2, padding),              # top center
        (w-padding, padding + h*0.1), # top right
        (w-padding, h*0.6),           # right curve start
        (w/2, h-padding),             # bottom center
        (padding, h*0.6),             # left curve start
        (padding, padding + h*0.1)    # top left
    ]
    
    draw.polygon(points, fill=(59, 130, 246, 255)) # --accent #3b82f6
    
    # "P" outline in white
    # Too complicated for small sizes, just the shield is fine or a simple P
    if size >= 48:
        font_size = int(size * 0.4)
        draw.text((size/2, size/2), "P", fill="white", anchor="mm", font_size=font_size)

    img.save(filename)

if __name__ == '__main__':
    create_icon(16, 'icons/icon16.png')
    create_icon(48, 'icons/icon48.png')
    create_icon(128, 'icons/icon128.png')
