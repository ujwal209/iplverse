"use client";

import LinkNext from "next/link";
import { GlobalNav } from "@/components/global-nav";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-[#401A23]/60 text-sm mb-12">
            Last Updated: June 20, 2026
          </p>

          <div className="space-y-10 bg-white border border-[#0B2A96]/10 rounded-3xl p-6 sm:p-10 shadow-sm leading-relaxed text-[#401A23]/80">
            <section>
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">1. Information We Collect</h2>
              <p className="text-sm mb-4">
                We collect minimal identity details to power authentication and leaderboard scoring:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#401A23]/70">
                <li><strong>Authentication Data:</strong> Managed securely via Clerk. We receive details like email address, profile picture, and display name. We do not store or process passwords.</li>
                <li><strong>Gameplay Logs:</strong> Scores, completion times, and answers submitted are saved to verify scores and compile rankings in our database.</li>
              </ul>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">2. Use of Information</h2>
              <p className="text-sm mb-4">
                Your data is exclusively utilized to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#401A23]/70">
                <li>Provide authentication and display your profile name on active game dashboards.</li>
                <li>Compile public leaderboards showcasing game scores.</li>
                <li>Analyse usage patterns to improve platform speed and gameplay logic.</li>
              </ul>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">3. Third-Party Integrations</h2>
              <p className="text-sm mb-4">
                We partner with select infrastructure providers to run IPL Verse:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-[#401A23]/70">
                <li><strong>Clerk:</strong> Handles authentication flow, user profile updates, and secure sessions.</li>
                <li><strong>Supabase:</strong> Serves as our primary database storage for leaderboard rankings and logs.</li>
              </ul>
              <p className="text-sm mt-4">
                These third parties handle your data strictly according to their respective privacy policies.
              </p>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">4. Cookies & Storage</h2>
              <p className="text-sm">
                We utilize essential browser cookies (set by Clerk) to preserve your session state. We do not place advertising track-cookies.
              </p>
            </section>

            <section className="border-t border-[#0B2A96]/10 pt-8">
              <h2 className="text-xl font-bold text-[#401A23] mb-4 google-sans-bold">5. Contact Information</h2>
              <p className="text-sm">
                If you have questions regarding data retention or would like to request account details deletion, please use our Contact page or email us at support@iplverse.com.
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
