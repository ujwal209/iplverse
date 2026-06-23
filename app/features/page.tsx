"use client";

import Link from "next/link";
import { GlobalNav } from "@/components/global-nav";
import { Gamepad2, BarChart3, Users, Swords, MapPin, Flag, Trophy, Shield, Sparkles, ArrowRight } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 overflow-hidden bg-gradient-to-b from-[#0B2A96]/5 to-transparent">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B2A96]/10 text-[#0B2A96] text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" /> Next-Gen Cricket Gaming
            </div>
            
            <h1 className="text-display text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
              Play. Analyze. <br />
              <span className="text-[#0B2A96]">Rule the Leaderboard.</span>
            </h1>

            <p className="text-body text-lg sm:text-xl text-[#401A23]/80 max-w-3xl mx-auto leading-relaxed">
              Explore the rich suite of analytical tools and engaging daily puzzles built exclusively for fans who look beyond the scoreboard.
            </p>
          </div>
        </section>

        {/* Feature Groups */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Grid 1: Daily Puzzles */}
            <div className="mb-24">
              <div className="text-center lg:text-left mb-12 max-w-2xl">
                <h2 className="text-heading text-3xl font-extrabold mb-4">1. Daily Brain Challenges</h2>
                <p className="text-body text-[#401A23]/70">
                  Keep your cricket brain sharp with daily-refreshing game modes. Test player details, compare statistical values, and solve complex player relations.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="p-6 rounded-3xl border border-[#0B2A96]/10 bg-white shadow-sm hover:border-[#0B2A96]/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] mb-6 border border-[#0B2A96]/20">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading text-lg font-bold mb-2">Guess Who</h3>
                  <p className="text-xs text-[#401A23]/70 leading-relaxed">
                    Identify the secret player using dynamic hints like batting style, age bounds, nationality and active franchise tags.
                  </p>
                </div>

                <div className="p-6 rounded-3xl border border-[#0B2A96]/10 bg-white shadow-sm hover:border-[#0B2A96]/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] mb-6 border border-[#0B2A96]/20">
                    <Swords className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading text-lg font-bold mb-2">Stat Smash</h3>
                  <p className="text-xs text-[#401A23]/70 leading-relaxed">
                    Test your historical intuition in a higher-or-lower comparison matchup between two legendary IPL batsmen or bowlers.
                  </p>
                </div>

                <div className="p-6 rounded-3xl border border-[#0B2A96]/10 bg-white shadow-sm hover:border-[#0B2A96]/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] mb-6 border border-[#0B2A96]/20">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading text-lg font-bold mb-2">Connections</h3>
                  <p className="text-xs text-[#401A23]/70 leading-relaxed">
                    Group 16 players into 4 discrete categories based on hidden similarities like squad associations or milestone criteria.
                  </p>
                </div>

                <div className="p-6 rounded-3xl border border-[#0B2A96]/10 bg-white shadow-sm hover:border-[#0B2A96]/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] mb-6 border border-[#0B2A96]/20">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-heading text-lg font-bold mb-2">1v1 Arena</h3>
                  <p className="text-xs text-[#401A23]/70 leading-relaxed">
                    Play real-time trivia battles against other fans. Answer fast, answer correctly, and climb the competitive tiers.
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 2: Advanced Analytics */}
            <div>
              <div className="text-center lg:text-left mb-12 max-w-2xl">
                <h2 className="text-heading text-3xl font-extrabold mb-4">2. Deep Analytics Dashboard</h2>
                <p className="text-body text-[#401A23]/70">
                  Step into our professional statistical database. Query player performance records, venue splits, and match historical stats.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="p-8 rounded-3xl border border-[#0B2A96]/10 bg-[#0B2A96]/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#0B2A96]/20 flex items-center justify-center text-[#0B2A96]">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <h3 className="text-heading text-lg font-bold">Matchup Analysis</h3>
                  </div>
                  <p className="text-sm text-[#401A23]/80 leading-relaxed">
                    Run Head-to-Head (H2H) and Player-vs-Team (PvT) comparisons. See strike rates, dismissal histories, and boundary rates.
                  </p>
                </div>

                <div className="p-8 rounded-3xl border border-[#0B2A96]/10 bg-[#0B2A96]/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#0B2A96]/20 flex items-center justify-center text-[#0B2A96]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="text-heading text-lg font-bold">Venue & Pitch Splits</h3>
                  </div>
                  <p className="text-sm text-[#401A23]/80 leading-relaxed">
                    Analyze pitch statistics across all major IPL stadiums. View average 1st-innings score, spin-vs-pace splits, and chasing success rates.
                  </p>
                </div>

                <div className="p-8 rounded-3xl border border-[#0B2A96]/10 bg-[#0B2A96]/5 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-white border border-[#0B2A96]/20 flex items-center justify-center text-[#0B2A96]">
                      <Flag className="h-5 w-5" />
                    </div>
                    <h3 className="text-heading text-lg font-bold">Team Breakdown</h3>
                  </div>
                  <p className="text-sm text-[#401A23]/80 leading-relaxed">
                    Inspect current and historic team lineups. Review squad balance sheets, salary structures, and seasonal statistics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-[#0B2A96] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
            <h2 className="text-display text-4xl sm:text-5xl font-extrabold leading-tight">
              Ready to test your IPL limits?
            </h2>
            <p className="text-body text-blue-100 max-w-xl mx-auto text-base sm:text-lg">
              Start building your daily win streak and claim your spot among the top 1% of global cricket brains.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/register" 
                className="h-12 px-8 rounded-xl bg-white text-[#0B2A96] hover:bg-blue-50 transition-colors flex items-center justify-center font-bold shadow-lg"
              >
                Create Account
              </Link>
              <Link 
                href="/login" 
                className="h-12 px-8 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center font-bold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-[#0B2A96]/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-caption text-sm">
              © {new Date().getFullYear()} IPL Verse. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm font-semibold text-muted-foreground">
              <Link href="/terms" className="hover:text-[#0B2A96] transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-[#0B2A96] transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
