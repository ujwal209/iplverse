"use client";

import ArenaQuiz from "@/app/dashboard/games/arena-quiz/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneArenaQuiz() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <ArenaQuiz />
      </main>
    </div>
  );
}
