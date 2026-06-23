with open("app/dashboard/page.tsx", "r") as f:
    text = f.read()

# Just extract the return string
return_idx = text.find('  return (')
jsx = text[return_idx:]

import re
lines = jsx.split('\n')
depth = 0
for i, line in enumerate(lines):
    # This is a naive check but works for most formatted code
    opens = len(re.findall(r'<div\b', line))
    closes = len(re.findall(r'</div\b', line))
    
    if opens > 0 or closes > 0:
        print(f"L{i}: {line.strip()} | +{opens} -{closes} | depth: {depth}")
    
    depth += opens - closes
print("Final depth:", depth)
