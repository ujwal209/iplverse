with open("app/dashboard/page.tsx", "r") as f:
    text = f.read()

import re
opens = len(re.findall(r'<div', text))
closes = len(re.findall(r'</div', text))
print(f"divs: +{opens} -{closes}")

# Check other tags
for tag in ['span', 'h1', 'h2', 'h3', 'h4', 'p', 'form', 'button', 'input', 'label', 'Link', 'AnimatePresence', 'motion.div']:
    o = len(re.findall(rf'<{tag}\b', text))
    c = len(re.findall(rf'</{tag}\b', text))
    print(f"{tag}: +{o} -{c}")
