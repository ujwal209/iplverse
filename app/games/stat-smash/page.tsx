"use client";

import StatSmash from "@/app/dashboard/games/stat-smash/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneStatSmash() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <StatSmash />
      </main>
    </div>
  );
}
