"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useEffect, useState, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />; // Placeholder for layout shift
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-muted text-foreground hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-md border border-border bg-popover text-popover-foreground shadow-md outline-none z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => { setTheme("light"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground ${theme === "light" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            onClick={() => { setTheme("dark"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground ${theme === "dark" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            onClick={() => { setTheme("system"); setIsOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground ${theme === "system" ? "bg-accent text-accent-foreground" : ""}`}
          >
            <Monitor className="h-4 w-4" />
            System
          </button>
        </div>
      )}
    </div>
  );
}
