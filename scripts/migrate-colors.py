import os
import re

# Files to process
APP_DIR = '/workspace/turneo/apps/mobile/app'
SRC_DIR = '/workspace/turneo/apps/mobile/src'

# Color mappings: old pattern -> new token
REPLACEMENTS = [
    # Neutral palette -> token equivalents
    (r"colors\.neutral\[50\]", "colors.bgSecondary"),
    (r"colors\.neutral\[100\]", "colors.bgTertiary"),
    (r"colors\.neutral\[150\]", "colors.bgTertiary"),
    (r"colors\.neutral\[200\]", "colors.border"),
    (r"colors\.neutral\[300\]", "colors.border"),
    (r"colors\.neutral\[400\]", "colors.textTertiary"),
    (r"colors\.neutral\[500\]", "colors.textTertiary"),
    (r"colors\.neutral\[600\]", "colors.textSecondary"),
    (r"colors\.neutral\[700\]", "colors.textSecondary"),
    (r"colors\.neutral\[800\]", "colors.textPrimary"),
    (r"colors\.neutral\[850\]", "colors.textPrimary"),
    (r"colors\.neutral\[900\]", "colors.textPrimary"),
    (r"colors\.neutral\[950\]", "colors.textPrimary"),
    (r"colors\.neutral\[0\]", "colors.bg"),
    
    # Primary indexed -> token
    (r"colors\.primary\[50\]", "colors.primaryLight"),
    (r"colors\.primary\[100\]", "colors.primaryLight"),
    (r"colors\.primary\[200\]", "colors.primaryLight"),
    (r"colors\.primary\[300\]", "(colors.primary as string)"),
    (r"colors\.primary\[400\]", "(colors.primary as string)"),
    (r"colors\.primary\[500\]", "(colors.primary as string)"),
    (r"colors\.primary\[600\]", "(colors.primary as string)"),
    (r"colors\.primary\[700\]", "colors.primaryDark"),
    (r"colors\.primary\[800\]", "colors.primaryDark"),
    (r"colors\.primary\[900\]", "colors.primaryDark"),
    
    # Secondary indexed -> token  
    (r"colors\.secondary\[500\]", "colors.accent"),
    (r"colors\.secondary\[400\]", "colors.accent"),
    (r"colors\.secondary\[600\]", "colors.accent"),
    
    # Status -> token
    (r"colors\.status\.error", "colors.error"),
    (r"colors\.status\.success", "colors.success"),
    (r"colors\.status\.warning", "colors.warning"),
    (r"colors\.status\.info", "colors.info"),
    
    # borderRadius -> radius
    (r"borderRadius\.xs", "radius.xs"),
    (r"borderRadius\.sm", "radius.sm"),
    (r"borderRadius\.md", "radius.md"),
    (r"borderRadius\.lg", "radius.lg"),
    (r"borderRadius\.xl", "radius.xl"),
    (r"borderRadius\.full", "radius.full"),
    (r"borderRadius\['2xl'\]", "radius['2xl']"),
    (r"borderRadius\['3xl'\]", "radius['3xl']"),
    
    # shadows -> shadow
    (r"shadows\.none", "shadow.none"),
    (r"shadows\.xs", "shadow.xs"),
    (r"shadows\.sm", "shadow.sm"),
    (r"shadows\.md", "shadow.md"),
    (r"shadows\.lg", "shadow.lg"),
    (r"shadows\.xl", "shadow.xl"),
    (r"shadows\.glow", "shadow.glow"),
]

# Also fix imports to include radius and shadow
IMPORT_FIXES = [
    # If file imports borderRadius from spacing but not radius, add radius
    (r"import \{ ([^}]*?)borderRadius([^}]*?) \} from ['\"]\.\./(\.\./)*(src/)?theme/spacing['\"];",
     lambda m: m.group(0).replace('borderRadius', 'borderRadius, radius') if 'radius' not in m.group(0) else m.group(0)),
]

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Apply replacements
    for pattern, replacement in REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    # Fix imports: if we now use radius/shadow but only imported borderRadius/shadows
    # Add radius alias import if needed
    if 'radius.' in content and 'radius' not in content.split('import')[0] if 'import' in content else True:
        # Check if file imports from spacing
        content = re.sub(
            r"(import \{[^}]*)(borderRadius)([^}]*\} from ['\"][^'\"]*spacing['\"])",
            lambda m: m.group(0) if ', radius' in m.group(0) or 'radius,' in m.group(0) else m.group(1) + m.group(2) + ', radius' + m.group(3),
            content
        )
    
    if 'shadow.' in content:
        content = re.sub(
            r"(import \{[^}]*)(shadows)([^}]*\} from ['\"][^'\"]*spacing['\"])",
            lambda m: m.group(0) if ', shadow' in m.group(0) or 'shadow,' in m.group(0) else m.group(1) + m.group(2) + ', shadow' + m.group(3),
            content
        )
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

def walk_and_process(directory):
    count = 0
    for root, dirs, files in os.walk(directory):
        for fname in files:
            if fname.endswith('.tsx') or fname.endswith('.ts'):
                filepath = os.path.join(root, fname)
                if process_file(filepath):
                    count += 1
                    print(f"  Updated: {filepath}")
    return count

print("Migrating color references to new token system...")
print()
print("Processing app/ directory:")
c1 = walk_and_process(APP_DIR)
print(f"  -> {c1} files updated")
print()
print("Processing src/ directory:")
c2 = walk_and_process(SRC_DIR)
print(f"  -> {c2} files updated")
print()
print(f"Total: {c1 + c2} files updated")