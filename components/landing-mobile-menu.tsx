"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export function LandingMobileMenu({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 -ml-2 rounded-lg hover:bg-muted/50 inline-block">
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Menu</span>
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b border-border/40 shadow-lg p-5 flex flex-col gap-5 z-50 overflow-y-auto max-h-[calc(100vh-4rem)] animate-in slide-in-from-top-2">
          {/* Games Section */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Games</p>
            <div className="flex flex-col gap-2 pl-1">
              <Link href="/dashboard/game" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Player Guess</Link>
            </div>
          </div>

          {/* Explore Section */}
          <div className="border-t border-border/40 pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Explore</p>
            <div className="flex flex-col gap-2 pl-1">
              <Link href="/#features" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Features</Link>
              <Link href="/#how-it-works" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">How It Works</Link>
              <Link href="/dashboard/leaderboards" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Leaderboard</Link>
              <Link href="/#faq" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">FAQ</Link>
            </div>
          </div>

          {/* Info Section */}
          <div className="border-t border-border/40 pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Info</p>
            <div className="flex flex-col gap-2 pl-1">
              <Link href="/contact" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Contact Us</Link>
              <Link href="/terms" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Terms of Service</Link>
              <Link href="/privacy" onClick={() => setOpen(false)} className="text-sm font-semibold hover:text-primary py-1">Privacy Policy</Link>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
            {!isSignedIn ? (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="w-full text-center px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-muted/50 transition-colors border border-border/50">
                  Log In
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="w-full text-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm font-medium">
                  Sign Up
                </Link>
              </>
            ) : (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="w-full text-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
