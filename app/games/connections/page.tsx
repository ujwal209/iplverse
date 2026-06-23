"use client";

import Connections from "@/app/dashboard/games/connections/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneConnections() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <Connections />
      </main>
    </div>
  );
}
