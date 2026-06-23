"use client";

import Link from "next/link";
import { GlobalNav } from "@/components/global-nav";
import { Trophy, Shield, Users, Target, Activity, Heart, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-b from-[#0B2A96]/5 to-transparent">
          <div className="absolute inset-0 z-0">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0B2A96]/5 rounded-full blur-[128px] animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#401A23]/5 rounded-full blur-[128px] animate-pulse duration-3000"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B2A96]/10 text-[#0B2A96] text-sm font-semibold mb-6">
              <Trophy className="h-4 w-4" /> Celebrating Cricket Analytics
            </div>
            
            <h1 className="text-display text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
              Decoding the Game, <br />
              <span className="text-[#0B2A96]">One Stat at a Time</span>
            </h1>

            <p className="text-body text-lg sm:text-xl text-[#401A23]/80 max-w-3xl mx-auto leading-relaxed">
              IPL Verse was born out of a simple passion: cricket is more than just boundaries and wickets—it is a beautiful universe of statistics, matchups, and historical narratives waiting to be decoded.
            </p>
          </div>
        </section>

        {/* The Mission Section */}
        <section className="py-20 border-t border-[#0B2A96]/10 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-heading text-3xl sm:text-4xl">
                  Our Mission: Bridging Fandom and Analytics
                </h2>
                <p className="text-body text-base text-[#401A23]/80 leading-relaxed">
                  Most trivia games ask simple, repetitive questions. At IPL Verse, we believe cricket fans deserve better. We compile massive, historical player and venue statistics to craft dynamic daily brain games that challenge your deep IPL intuition.
                </p>
                <p className="text-body text-base text-[#401A23]/80 leading-relaxed">
                  Whether you are deducing player identities in *Guess Who*, analyzing relative stat metrics in *Stat Smash*, or mapping complex squad relations in *Connections*, you are engaging with real cricket analytics.
                </p>

                <div className="pt-4">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-[#0B2A96] text-white hover:bg-[#0B2A96]/95 transition-all duration-200 font-medium shadow-lg shadow-[#0B2A96]/20"
                  >
                    Join the Arena Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              {/* Graphical Card Feature */}
              <div className="relative p-8 rounded-3xl bg-[#0B2A96]/5 border border-[#0B2A96]/10 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Shield className="w-64 h-64 text-[#0B2A96]" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-[#0B2A96]/15">
                    <div className="h-12 w-12 rounded-xl bg-[#0B2A96]/10 flex items-center justify-center border border-[#0B2A96]/20">
                      <Activity className="h-6 w-6 text-[#0B2A96]" />
                    </div>
                    <div>
                      <h3 className="text-heading text-xl">The Platform Pillars</h3>
                      <p className="text-caption">Built for the passionate fan</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700">✓</div>
                      <div>
                        <h4 className="font-bold text-[#401A23]">Mathematical Accuracy</h4>
                        <p className="text-sm text-[#401A23]/70">We scrape and synchronize raw player data directly from historic scorecards.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700">✓</div>
                      <div>
                        <h4 className="font-bold text-[#401A23]">Anti-Cheat System</h4>
                        <p className="text-sm text-[#401A23]/70">Leaderboard scores are backed by server-validated game completion signatures.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700">✓</div>
                      <div>
                        <h4 className="font-bold text-[#401A23]">Global Matchmaking</h4>
                        <p className="text-sm text-[#401A23]/70">Compare, duel and discuss results dynamically with thousands of fans.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Team / Creators */}
        <section className="py-20 border-t border-[#0B2A96]/10 bg-[#0B2A96]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-heading text-3xl sm:text-4xl mb-4">Meet the Dev Squad</h2>
            <p className="text-body text-[#401A23]/70 max-w-xl mx-auto mb-16">
              A diverse team of web engineers, cricket analysts, and sports enthusiasts working together to build your premium hub.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-[#0B2A96]/10 shadow-sm flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] font-bold text-2xl mb-6">
                  UA
                </div>
                <h3 className="text-heading text-lg font-bold mb-1">Ujwal A.</h3>
                <p className="text-sm text-[#0B2A96] font-semibold mb-4">Lead Architect & Founder</p>
                <p className="text-xs text-[#401A23]/70 leading-relaxed">
                  Obsessed with database queries and clean UI design. Responsible for the overall engineering direction.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-[#0B2A96]/10 shadow-sm flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] font-bold text-2xl mb-6">
                  SD
                </div>
                <h3 className="text-heading text-lg font-bold mb-1">Siddharth D.</h3>
                <p className="text-sm text-[#0B2A96] font-semibold mb-4">Chief Data Scientist</p>
                <p className="text-xs text-[#401A23]/70 leading-relaxed">
                  Maintains our massive database of 1000+ players. Lives and breathes player matchup matrices.
                </p>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-[#0B2A96]/10 shadow-sm flex flex-col items-center sm:col-span-2 lg:col-span-1">
                <div className="h-20 w-20 rounded-full bg-[#0B2A96]/10 flex items-center justify-center text-[#0B2A96] font-bold text-2xl mb-6">
                  SK
                </div>
                <h3 className="text-heading text-lg font-bold mb-1">Samir K.</h3>
                <p className="text-sm text-[#0B2A96] font-semibold mb-4">UI/UX Engineer</p>
                <p className="text-xs text-[#401A23]/70 leading-relaxed">
                  Polishes color systems, ensures screen responsiveness, and creates beautiful SVG micro-interactions.
                </p>
              </div>
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
