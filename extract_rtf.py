import re
import sys

with open('/home/z/my-project/upload/modified calculations.rtf', 'rb') as f:
    raw = f.read().decode('cp1252', errors='ignore')

# Step 1: RTF unicode escapes \uN? (N can be negative)
def uni(m):
    n = int(m.group(1))
    if n < 0:
        n += 65536
    return chr(n)
s = re.sub(r'\\u(-?\d+)\??', uni, raw)

# Step 2: remove destination groups we don't want (fonttbl, colortbl, etc.)
def remove_group(text, keyword):
    result = []
    i = 0
    needle = '{\\' + keyword
    while i < len(text):
        if text[i:i+len(needle)] == needle:
            depth = 1
            j = i + 2
            while j < len(text) and depth > 0:
                if text[j] == '{':
                    depth += 1
                elif text[j] == '}':
                    depth -= 1
                j += 1
            i = j
        else:
            result.append(text[i])
            i += 1
    return ''.join(result)

for kw in ['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer',
           'rsidtbl', 'generator', 'listtable', 'listoverridetable', 'operator',
           'category', 'comment', 'title', 'subject', 'author', 'manager',
           'company', 'keyword', 'userprop', 'fldsimp', 'fldrslt', 'fldinst',
           'datafield', 'filetbl', 'themedata', 'colorschememapping']:
    s = remove_group(s, kw)

# Step 3: breaks and quotes
s = s.replace('\\par', '\n').replace('\\line', '\n').replace('\\tab', '\t')
s = s.replace('\\ldblquote', '"').replace('\\rdblquote', '"')
s = s.replace('\\lquote', "'").replace('\\rquote', "'")
s = s.replace('\\emdash', '—').replace('\\endash', '–').replace('\\bullet', '•')
s = s.replace('\\~', ' ')

# Step 4: remaining control words \word[num] [space]
s = re.sub(r'\\[a-zA-Z]+-?\d* ?', '', s)
# \'XX hex escapes
def hexesc(m):
    return chr(int(m.group(1), 16))
s = re.sub(r"\\'([0-9a-fA-F]{2})", hexesc, s)
# leftover
s = s.replace('{', '').replace('}', '').replace('\\', '')

# Clean whitespace
s = re.sub(r'\n{3,}', '\n\n', s)
s = re.sub(r'[ \t]+', ' ', s)
s = s.strip()

with open('/home/z/my-project/upload/modified_calculations.txt', 'w') as f:
    f.write(s)
print('extracted', len(s), 'chars')
