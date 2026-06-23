  "use client";

import GuessWho from "@/app/dashboard/games/guess-who/page";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function StandaloneGuessWho() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#401A23]">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      <main className="flex-grow">
        <GuessWho />
      </main>
    </div>
  );
}
