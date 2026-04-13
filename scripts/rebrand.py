import os
import re

ROOT = '/workspace/tourneo'
SKIP_DIRS = {'node_modules', '.git', 'dist', 'build', '.expo', 'assets'}
EXTENSIONS = {'.ts', '.tsx', '.json', '.md', '.html', '.py', '.txt', '.css'}

# Precise replacements - order matters
REPLACEMENTS = [
    # Brand name
    ('Tourneo', 'Tourneo'),
    ('tourneo', 'tourneo'),
    ('TOURNEO', 'TOURNEO'),
]

# Files to skip entirely
SKIP_FILES = {'package-lock.json'}

def should_process(filepath):
    fname = os.path.basename(filepath)
    if fname in SKIP_FILES:
        return False
    _, ext = os.path.splitext(filepath)
    return ext in EXTENSIONS

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

count = 0
for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fname in files:
        filepath = os.path.join(root, fname)
        if should_process(filepath):
            if process_file(filepath):
                count += 1
                rel = os.path.relpath(filepath, ROOT)
                print(f"  {rel}")

print(f"\nTotal: {count} files rebranded to Tourneo")