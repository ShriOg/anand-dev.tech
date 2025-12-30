#!/usr/bin/env python3
"""
Generate icon assets for AI Assistant GUI.
Run once to create all required icons.
Requires: Pillow (pip install Pillow)
"""

from PIL import Image, ImageDraw
import os

ICON_DIR = os.path.dirname(os.path.abspath(__file__))

# Colors (dark theme compatible)
COLORS = {
    'bg': '#0a0a0c',
    'surface': '#1a1a1e',
    'accent': '#50c8ff',
    'warning': '#ffbd2e',
    'text': '#f0f0f3',
    'muted': '#5a5a62',
}


def create_app_icon():
    """Create main application icon (multiple sizes for .ico)"""
    sizes = [16, 32, 48, 64, 128, 256]
    images = []
    
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Background circle
        padding = size // 8
        draw.ellipse(
            [padding, padding, size - padding, size - padding],
            fill='#131316',
            outline='#50c8ff',
            width=max(1, size // 32)
        )
        
        # Robot face - eyes
        eye_size = size // 8
        eye_y = size // 3
        left_eye_x = size // 3 - eye_size // 2
        right_eye_x = 2 * size // 3 - eye_size // 2
        
        draw.ellipse(
            [left_eye_x, eye_y, left_eye_x + eye_size, eye_y + eye_size],
            fill='#50c8ff'
        )
        draw.ellipse(
            [right_eye_x, eye_y, right_eye_x + eye_size, eye_y + eye_size],
            fill='#50c8ff'
        )
        
        # Mouth - simple line
        mouth_y = int(size * 0.6)
        mouth_width = size // 3
        draw.arc(
            [size // 2 - mouth_width // 2, mouth_y - mouth_width // 4,
             size // 2 + mouth_width // 2, mouth_y + mouth_width // 4],
            start=0, end=180,
            fill='#50c8ff',
            width=max(1, size // 24)
        )
        
        images.append(img)
    
    # Save as .ico (Windows)
    ico_path = os.path.join(ICON_DIR, 'app.ico')
    images[0].save(ico_path, format='ICO', sizes=[(s, s) for s in sizes], append_images=images[1:])
    
    # Also save as PNG for cross-platform
    png_path = os.path.join(ICON_DIR, 'app.png')
    images[-1].save(png_path, 'PNG')
    
    print(f"Created: {ico_path}")
    print(f"Created: {png_path}")


def create_mic_icon(name, bg_color, icon_color, glow=False):
    """Create microphone icon"""
    size = 64
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Optional glow effect
    if glow:
        for i in range(8, 0, -1):
            alpha = int(30 * (1 - i / 8))
            glow_color = tuple(int(icon_color.lstrip('#')[j:j+2], 16) for j in (0, 2, 4)) + (alpha,)
            draw.ellipse([i, i, size - i, size - i], fill=glow_color)
    
    # Background circle
    padding = 4
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=bg_color
    )
    
    # Microphone body
    mic_width = size // 4
    mic_height = size // 3
    mic_x = size // 2 - mic_width // 2
    mic_y = size // 4
    
    # Mic head (rounded rectangle approximation)
    draw.rounded_rectangle(
        [mic_x, mic_y, mic_x + mic_width, mic_y + mic_height],
        radius=mic_width // 2,
        fill=icon_color
    )
    
    # Mic stand arc
    arc_y = mic_y + mic_height - 4
    arc_width = int(mic_width * 1.4)
    draw.arc(
        [size // 2 - arc_width // 2, arc_y,
         size // 2 + arc_width // 2, arc_y + mic_height // 2],
        start=0, end=180,
        fill=icon_color,
        width=3
    )
    
    # Mic stand stem
    stem_height = size // 8
    draw.line(
        [size // 2, arc_y + mic_height // 4, size // 2, arc_y + mic_height // 4 + stem_height],
        fill=icon_color,
        width=3
    )
    
    # Base
    base_width = size // 4
    draw.line(
        [size // 2 - base_width // 2, arc_y + mic_height // 4 + stem_height,
         size // 2 + base_width // 2, arc_y + mic_height // 4 + stem_height],
        fill=icon_color,
        width=3
    )
    
    path = os.path.join(ICON_DIR, f'{name}.png')
    img.save(path, 'PNG')
    print(f"Created: {path}")


def create_status_icon(name, color):
    """Create status indicator dot"""
    size = 24
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Simple filled circle
    padding = 4
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=color
    )
    
    path = os.path.join(ICON_DIR, f'{name}.png')
    img.save(path, 'PNG')
    print(f"Created: {path}")


def main():
    print("Generating AI Assistant icons...\n")
    
    # App icon
    create_app_icon()
    
    # Microphone icons
    create_mic_icon('mic_idle', '#1a1a1e', '#9a9aa0')
    create_mic_icon('mic_listening', '#50c8ff', '#0a0a0c', glow=True)
    create_mic_icon('mic_processing', '#ffbd2e', '#0a0a0c')
    
    # Status icons
    create_status_icon('status_idle', '#9a9aa0')
    create_status_icon('status_listening', '#50c8ff')
    create_status_icon('status_processing', '#ffbd2e')
    
    print("\n✓ All icons generated successfully!")
    print(f"  Location: {ICON_DIR}")


if __name__ == '__main__':
    main()
