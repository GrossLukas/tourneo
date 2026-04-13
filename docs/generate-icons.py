#!/usr/bin/env python3
"""Generate Turneo app icons - Direction B (Dynamic/Sportlich/Modern) using Pillow"""
from PIL import Image, ImageDraw
import math
import os

def draw_icon(size):
    """Draw the Turneo icon at given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background gradient (dark)
    for y in range(size):
        t = y / size
        r = int(13 + (22 - 13) * t)
        g = int(17 + (27 - 17) * t)
        b = int(23 + (34 - 23) * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    s = size / 56.0
    teal = (38, 190, 201)
    teal_dark = (10, 126, 140)
    coral = (232, 101, 74)
    
    line_w = max(2, int(5.0 * s))
    arc_w = max(1, int(2.8 * s))
    
    # Horizontal bar of T
    draw.line([(int(10*s), int(14*s)), (int(46*s), int(14*s))], fill=teal, width=line_w)
    # Round caps
    cap_r = line_w // 2
    draw.ellipse([int(10*s)-cap_r, int(14*s)-cap_r, int(10*s)+cap_r, int(14*s)+cap_r], fill=teal)
    draw.ellipse([int(46*s)-cap_r, int(14*s)-cap_r, int(46*s)+cap_r, int(14*s)+cap_r], fill=teal)
    
    # Vertical bar of T
    draw.line([(int(28*s), int(14*s)), (int(28*s), int(42*s))], fill=teal_dark, width=line_w)
    draw.ellipse([int(28*s)-cap_r, int(42*s)-cap_r, int(28*s)+cap_r, int(42*s)+cap_r], fill=teal_dark)
    
    # Motion arc (quadratic bezier)
    points = []
    for i in range(50):
        t = i / 49.0
        x = (1-t)**2 * 8 + 2*(1-t)*t * 28 + t**2 * 48
        y = (1-t)**2 * 46 + 2*(1-t)*t * 30 + t**2 * 10
        points.append((int(x * s), int(y * s)))
    
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=coral + (200,), width=arc_w)
    
    # Coral ball at end of arc
    ball_r = max(2, int(4.0 * s))
    cx, cy = int(48*s), int(10*s)
    draw.ellipse([cx-ball_r, cy-ball_r, cx+ball_r, cy+ball_r], fill=coral)
    
    return img

def main():
    sizes = {
        'icon.png': 1024,
        'adaptive-icon.png': 1024,
        'splash-icon.png': 512,
        'favicon.png': 48,
    }
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'apps', 'mobile', 'assets')
    os.makedirs(output_dir, exist_ok=True)
    
    for filename, size in sizes.items():
        print(f"Generating {filename} ({size}x{size})...")
        img = draw_icon(size)
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, 'PNG')
        print(f"  ✓ Saved: {filepath}")
    
    # Generate splash.png (larger with padding)
    print("Generating splash.png (1284x2778)...")
    splash = Image.new('RGBA', (1284, 2778), (13, 17, 23, 255))
    # Draw gradient background
    splash_draw = ImageDraw.Draw(splash)
    for y in range(2778):
        t = y / 2778
        r = int(13 + (10 - 13) * t)
        g = int(17 + (14 - 17) * t)
        b = int(23 + (20 - 23) * t)
        splash_draw.line([(0, y), (1284, y)], fill=(r, g, b, 255))
    
    icon = draw_icon(280)
    # Center the icon
    x = (1284 - 280) // 2
    y = (2778 - 280) // 2 - 100
    splash.paste(icon, (x, y), icon)
    
    splash_path = os.path.join(output_dir, 'splash.png')
    splash.save(splash_path, 'PNG')
    print(f"  ✓ Saved: {splash_path}")
    
    print("\n✅ All icons generated successfully!")

if __name__ == '__main__':
    main()