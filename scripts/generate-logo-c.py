from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = '/workspace/turneo/apps/mobile/assets'

def create_icon_c(size):
    """Direction C: Premium/Event/Arena - Shield shape with T"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx, cy = size / 2, size / 2
    s = size / 1024  # scale factor
    
    # Background: Deep teal gradient (simulated)
    # Rounded square background
    margin = int(80 * s)
    corner = int(180 * s)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=corner,
        fill='#065B66'
    )
    
    # Inner glow/gradient simulation - lighter center
    inner_margin = int(120 * s)
    inner_corner = int(150 * s)
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=inner_corner,
        fill='#0A7E8C'
    )
    
    # Shield shape overlay (subtle)
    shield_top = int(160 * s)
    shield_bottom = int(820 * s)
    shield_left = int(220 * s)
    shield_right = int(804 * s)
    shield_mid_y = int(650 * s)
    
    shield_points = [
        (shield_left, shield_top),
        (shield_right, shield_top),
        (shield_right, shield_mid_y),
        (cx, shield_bottom),
        (shield_left, shield_mid_y),
    ]
    draw.polygon(shield_points, fill='#044952')
    
    # Inner shield (lighter)
    inner_s = 0.88
    inner_shield = []
    for x, y in shield_points:
        ix = cx + (x - cx) * inner_s
        iy = cy + (y - cy) * inner_s + 10 * s
        inner_shield.append((ix, iy))
    draw.polygon(inner_shield, fill='#086E7A')
    
    # Letter "T" - bold, centered, premium
    t_color = '#FFFFFF'
    
    # T horizontal bar
    bar_top = int(280 * s)
    bar_height = int(70 * s)
    bar_left = int(310 * s)
    bar_right = int(714 * s)
    bar_radius = int(20 * s)
    draw.rounded_rectangle(
        [bar_left, bar_top, bar_right, bar_top + bar_height],
        radius=bar_radius,
        fill=t_color
    )
    
    # T vertical stem
    stem_width = int(80 * s)
    stem_left = cx - stem_width / 2
    stem_top = bar_top + bar_height - int(10 * s)
    stem_bottom = int(720 * s)
    draw.rounded_rectangle(
        [stem_left, stem_top, stem_left + stem_width, stem_bottom],
        radius=bar_radius,
        fill=t_color
    )
    
    # Coral accent line under the T bar
    accent_y = bar_top + bar_height + int(15 * s)
    accent_height = int(8 * s)
    accent_left = int(380 * s)
    accent_right = int(644 * s)
    draw.rounded_rectangle(
        [accent_left, accent_y, accent_right, accent_y + accent_height],
        radius=int(4 * s),
        fill='#E8654A'
    )
    
    # Small stars / premium dots
    dot_r = int(10 * s)
    dot_y = int(760 * s)
    for dx in [-60, 0, 60]:
        dot_x = cx + dx * s
        draw.ellipse(
            [dot_x - dot_r, dot_y - dot_r, dot_x + dot_r, dot_y + dot_r],
            fill='#E8654A'
        )
    
    return img

# Generate all icon sizes
sizes = {
    'icon.png': 1024,
    'adaptive-icon.png': 1024,
    'favicon.png': 48,
    'splash-icon.png': 512,
}

os.makedirs(OUTPUT_DIR, exist_ok=True)

for filename, size in sizes.items():
    icon = create_icon_c(size)
    path = os.path.join(OUTPUT_DIR, filename)
    # Convert to RGB for non-transparent formats
    if filename in ('icon.png', 'adaptive-icon.png'):
        bg = Image.new('RGB', (size, size), '#065B66')
        bg.paste(icon, (0, 0), icon)
        bg.save(path, 'PNG')
    else:
        icon.save(path, 'PNG')
    print(f"  Generated {filename} ({size}x{size})")

# Splash screen
splash_w, splash_h = 1284, 2778
splash = Image.new('RGB', (splash_w, splash_h), '#065B66')
splash_draw = ImageDraw.Draw(splash)

# Gradient simulation
for y in range(splash_h):
    ratio = y / splash_h
    r = int(6 + (10 - 6) * ratio)
    g = int(91 + (126 - 91) * (1 - abs(ratio - 0.4) * 2))
    b = int(102 + (140 - 102) * (1 - abs(ratio - 0.4) * 2))
    splash_draw.line([(0, y), (splash_w, y)], fill=(r, g, b))

# Center the icon
icon_size = 400
icon = create_icon_c(icon_size)
x = (splash_w - icon_size) // 2
y = (splash_h - icon_size) // 2 - 100
splash.paste(icon, (x, y), icon)

# Brand text
text_y = y + icon_size + 40
text = "TOURNEO"
# Simple text (no custom font available)
for i, char in enumerate(text):
    char_x = (splash_w // 2) - (len(text) * 18) + (i * 36)
    splash_draw.text((char_x, text_y), char, fill='#FFFFFF')

splash.save(os.path.join(OUTPUT_DIR, 'splash.png'), 'PNG')
print(f"  Generated splash.png ({splash_w}x{splash_h})")

print("\nAll Direction C (Premium/Arena) assets generated!")