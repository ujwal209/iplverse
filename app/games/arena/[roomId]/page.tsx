"use client";

import ArenaRoom from "@/app/dashboard/arena/[roomId]/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneArenaRoom() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <ArenaRoom />
      </main>
    </div>
  );
}
