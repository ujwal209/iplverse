import re

# 1. Read the Premium page I built
with open("app/dashboard/page.tsx", "r") as f:
    premium_content = f.read()

# Modify premium_content to include GlobalNav
if "import { GlobalNav } from" not in premium_content:
    # insert after imports
    premium_content = premium_content.replace(
        'import { CustomSelect } from "@/components/ui/custom-select";',
        'import { CustomSelect } from "@/components/ui/custom-select";\nimport { GlobalNav } from "@/components/global-nav";'
    )

# Insert GlobalNav at the top of the return statement
premium_content = premium_content.replace(
    '<div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-transparent overflow-x-hidden">',
    '<div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-transparent overflow-x-hidden">\n      <GlobalNav />'
)

# 2. Write Premium to app/page.tsx
with open("app/page.tsx", "w") as f:
    f.write(premium_content)

# 3. Restore old dashboard
with open("scratch/old_dashboard.tsx", "r") as f:
    old_dashboard = f.read()

with open("app/dashboard/page.tsx", "w") as f:
    f.write(old_dashboard)

# 4. Remove sidebar patch
with open("components/dashboard/sidebar.tsx", "r") as f:
    sidebar_content = f.read()
sidebar_content = sidebar_content.replace(
    """  // Hide sidebar completely on the dashboard landing page
  if (pathname === "/dashboard") {
    return null;
  }""", 
    ""
)
with open("components/dashboard/sidebar.tsx", "w") as f:
    f.write(sidebar_content)

with open("components/dashboard/sidebar-trigger.tsx", "r") as f:
    trigger_content = f.read()
trigger_content = trigger_content.replace(
    """  if (pathname === "/dashboard") return null;""",
    ""
)
with open("components/dashboard/sidebar-trigger.tsx", "w") as f:
    f.write(trigger_content)

print("Swapped successfully.")
