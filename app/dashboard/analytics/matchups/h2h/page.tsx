"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";

import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";

export default function HeadToHeadHub() {
  const router = useRouter();
  const [batter, setBatter] = useState("");
  const [bowler, setBowler] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batter.trim() || !bowler.trim()) return;
    router.push(`/dashboard/analytics/matchups/h2h/${encodeURIComponent(batter)}/${encodeURIComponent(bowler)}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-12 max-w-5xl mx-auto pt-12 pb-24">
      <div className="text-center space-y-4 w-full">
        <div className="mx-auto h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-lg">
          <Swords className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold outfit-bold tracking-tight">Head-to-Head</h1>
        <p className="inter-regular text-muted-foreground text-lg max-w-2xl mx-auto">
          Analyze historical battles. Who comes out on top?
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-8 bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-10">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <PlayerAutocomplete 
            label="Batter"
            placeholder="e.g. Virat Kohli"
            value={batter}
            onChange={setBatter}
          />
          
          <div className="font-bold text-2xl text-muted-foreground/50 outfit-bold italic px-4">
            VS
          </div>
          
          <PlayerAutocomplete 
            label="Bowler"
            placeholder="e.g. Jasprit Bumrah"
            value={bowler}
            onChange={setBowler}
          />
        </form>
        
        <div className="mt-8 flex justify-center">
          <button 
            type="submit"
            onClick={handleSearch} 
            disabled={!batter || !bowler} 
            className="h-14 px-12 text-lg outfit-bold rounded-xl w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Matchup
          </button>
        </div>
      </div>
    </div>
  );
}
