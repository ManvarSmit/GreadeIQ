import os

replacements = {
    'text-slate-900': 'text-white',
    'text-slate-800': 'text-white',
    'text-slate-700': 'text-dark-muted',
    'text-slate-600': 'text-dark-muted',
    'text-slate-500': 'text-dark-muted',
    'text-secondary-900': 'text-white',
    'text-secondary-800': 'text-white',
    'text-secondary-700': 'text-dark-muted',
    'text-gray-800': 'text-white',
    'bg-slate-50': 'bg-dark-bg',
    'bg-slate-100': 'bg-dark-surface',
    'border-slate-100': 'border-dark-border',
    'border-slate-200': 'border-dark-border',
}

directory = r'c:\Users\DELL LATITUDE\OneDrive\Desktop\GreadeIQ\frontend\src'
updated_count = 0

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated_count += 1
                print(f'Updated {file}')

print(f'\nTotal files updated: {updated_count}')
