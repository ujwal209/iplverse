with open("scratch/old_dashboard.tsx", "r") as f:
    text = f.read()

# The main return is at the end of the file. It starts with:
#   return (
#     <div className="bg-[#F8FAFC] min-h-[90vh] text-[#1E293B] flex flex-col">
import re

# Find the start of the main return statement
match = re.search(r'  return \(\n    <div className="bg-\[#F8FAFC\]', text)
if match:
    idx = match.start()
    header_and_logic = text[:idx]
else:
    print("Could not find main return")
    exit(1)

with open("app/dashboard/page.tsx", "r") as f:
    curr_text = f.read()

# We need the new return from curr_text
match2 = re.search(r'  return \(\n    <div className="min-h-screen', curr_text)
if match2:
    idx2 = match2.start()
    new_return = curr_text[idx2:]
else:
    print("Could not find new return")
    exit(1)

with open("app/dashboard/page.tsx", "w") as f:
    f.write(header_and_logic + new_return)

print("Fixed dashboard layout properly.")
