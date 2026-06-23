with open("components/dashboard/sidebar.tsx", "r") as f:
    content = f.read()

# We insert `if (pathname === "/dashboard") return null;` at the beginning of the `Sidebar` component.

# Look for `const [isMounted, setIsMounted] = useState(false);`
# Or `export function Sidebar({ mobileOnly = false }: { mobileOnly?: boolean }) {`

import re

new_code = """export function Sidebar({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Hide sidebar completely on the dashboard landing page
  if (pathname === "/dashboard") {
    return null;
  }"""

content = re.sub(
    r'export function Sidebar.*?const \[isMounted, setIsMounted\] = useState\(false\);',
    new_code,
    content,
    flags=re.DOTALL
)

with open("components/dashboard/sidebar.tsx", "w") as f:
    f.write(content)

print("Patched sidebar.tsx to hide on /dashboard")
