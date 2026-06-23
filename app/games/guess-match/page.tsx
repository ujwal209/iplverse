"use client";

import GuessTheMatch from "@/app/dashboard/games/guess-match/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneGuessMatch() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <GuessTheMatch />
      </main>
    </div>
  );
}
