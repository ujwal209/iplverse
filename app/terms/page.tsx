"use client";

import Link from "react-of-link";
import LinkNext from "next/link";
import { GlobalNav } from "@/components/global-nav";
import { ArrowLeft, Trophy } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />

      <main className="flex-1 py-12 sm:py-20 bg-gradient-to-b from-white to-[#0B2A96]/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <LinkNext href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B2A96] hover:text-[#0B2A96]/80 mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </LinkNext>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 google-sans-bold text-[#401A23]">
            Terms of Service
          </h1>
          <p className="text-[#401A23]/60 text-sm mb-12">
            Last Updated: June 20, 2026
          </p>

          <div className="space-y-10 bg-white border border-[#0B2A96]/10 rounded-3xl p-6 sm:p-10 shadow-sm leading-relaxed text-[#401A23]/80">
            <section>
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">1. Agreement to Terms</h2>
              <p className="text-sm">
                By accessing or playing IPL Verse, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use our services.
              </p>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">2. Use License & Account Responsibility</h2>
              <p className="text-sm mb-4">
                We grant you a personal, non-transferable, non-exclusive license to use the IPL Verse gaming platform for entertainment.
              </p>
              <p className="text-sm">
                You are responsible for maintaining the security of your login details (provided via Clerk) and for all actions occurring under your user profile.
              </p>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">3. Fair Play Policy</h2>
              <p className="text-sm mb-4">
                We advocate for a competitive and transparent gaming atmosphere. To maintain integrity:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#401A23]/70">
                <li>Automated scrapers, bots, or scripts designed to answer questions automatically are strictly prohibited.</li>
                <li>Exploits of data APIs or manipulation of points system results will lead to immediate account termination.</li>
                <li>Users are limited to one active leaderboard account. Multi-accounting to skew ratings is prohibited.</li>
              </ul>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">4. Disclaimer of Warranties</h2>
              <p className="text-sm">
                IPL Verse is provided on an &quot;AS IS&quot; basis. We make no warranties, expressed or implied, regarding statistics accuracy, server uptime, or uninterrupted gameplay cycles. All player statistics are sourced from public historical data.
              </p>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">5. Modifications to Service</h2>
              <p className="text-sm">
                We reserve the right to modify, pause, or reset game scores, leaderboards, and rules at any point to sustain fair play or implement balance upgrades.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-[#0B2A96]/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-caption text-sm text-[#401A23]/70">
              © {new Date().getFullYear()} IPL Verse. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-semibold text-muted-foreground">
              <LinkNext href="/terms" className="hover:text-[#0B2A96] transition-colors">Terms</LinkNext>
              <LinkNext href="/privacy" className="hover:text-[#0B2A96] transition-colors">Privacy</LinkNext>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
