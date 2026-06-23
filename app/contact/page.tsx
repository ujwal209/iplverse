import Link from "next/link";
import { Trophy, ArrowLeft, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";

export default async function ContactPage() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <LandingMobileMenu isSignedIn={isSignedIn} />
            <Link href="/" className="flex gap-2 items-center">
              <Trophy className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight google-sans-bold text-foreground">IPL Verse</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2">
              {!isSignedIn ? (
                <>
                  <Link href="/login" className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-muted/50 transition-colors inter-bold">
                    Log In
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors outfit-bold shadow-sm">
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-muted/50 transition-colors inter-bold mr-2">
                    Dashboard
                  </Link>
                  <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 sm:py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="text-center sm:text-left mb-12">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 google-sans-bold">
              Contact Our Team
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl">
              Have questions about game score calculation, features feedback, or partnerships? Drop us a message below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form Card */}
            <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-6 sm:p-10 shadow-sm">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full h-12 rounded-xl bg-background border border-border/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full h-12 rounded-xl bg-background border border-border/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="How can we help?"
                    className="w-full h-12 rounded-xl bg-background border border-border/60 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Provide detailed context..."
                    className="w-full rounded-xl bg-background border border-border/60 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-foreground resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm text-sm"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Info Cards Side */}
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm google-sans-bold">Direct Email</h3>
                    <p className="text-xs text-muted-foreground mt-1">support@iplverse.com</p>
                    <p className="text-xs text-muted-foreground">inquiries@iplverse.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm google-sans-bold">Support Hours</h3>
                    <p className="text-xs text-muted-foreground mt-1">Monday - Friday</p>
                    <p className="text-xs text-muted-foreground">9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm google-sans-bold">FAQ Guide</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check our FAQ section on the home page for swift answers.
                    </p>
                    <Link href="/#faq" className="text-xs font-bold text-primary hover:underline mt-2 inline-block">
                      Go to FAQ
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background py-12 border-t border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg tracking-tight text-foreground">IPL Verse</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} IPL Verse. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm font-semibold text-muted-foreground">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-primary transition-colors text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
