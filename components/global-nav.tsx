"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { UserButton, Show } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export function GlobalNav() {
  const pathname = usePathname();

  const toggleSidebar = () => {
    window.dispatchEvent(new Event("toggle-sidebar"));
  };

  return (
    <>
      {/* Desktop Top Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur h-20 flex-shrink-0 hidden lg:block">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between relative">
          
          {/* Left Side: Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-16 w-auto object-contain transition-transform group-hover:scale-[1.02]" />
            </Link>
          </div>

          {/* Center Side: Navigation Links Removed */}

          {/* Right Side: Auth / Action Buttons */}
          <div className="flex items-center gap-4">
            <Show 
              when="signed-in"
              fallback={
                <div className="flex items-center gap-3">
                  <Link 
                    href="/login" 
                    className="text-sm font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 shadow-md transition-all duration-200 google-sans-regular"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="text-sm font-semibold px-4 py-2 border border-border rounded-xl hover:bg-muted transition-all duration-200 google-sans-regular text-foreground"
                  >
                    Sign Up
                  </Link>
                </div>
              }
            >
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard" 
                  className="text-sm font-semibold px-4 py-2 border border-border rounded-xl hover:bg-muted transition-all duration-200 google-sans-regular text-foreground"
                >
                  Dashboard
                </Link>
                <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 border-2 border-border/50" } }} />
              </div>
            </Show>
          </div>
        </div>
      </header>

      {/* Mobile Top Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur h-18 flex-shrink-0 lg:hidden">
        <div className="w-full px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleSidebar}
              className="p-2 bg-muted/50 rounded-xl hover:bg-muted text-foreground transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-14 w-auto object-contain" />
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Show
              when="signed-in"
              fallback={
                <div className="flex items-center gap-2">
                  <Link 
                    href="/login" 
                    className="text-xs font-semibold px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/register" 
                    className="text-xs font-semibold px-2.5 py-1.5 border border-border rounded-lg hover:bg-muted transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              }
            >
              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="text-xs font-semibold px-2.5 py-1.5 border border-border rounded-lg hover:bg-muted transition-all text-foreground"
                >
                  Dashboard
                </Link>
                <UserButton appearance={{ elements: { avatarBox: "h-8 w-8 border border-border/50" } }} />
              </div>
            </Show>
          </div>
        </div>
      </header>
    </>
  );
}
