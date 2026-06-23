"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";
import { TeamDropdown } from "@/components/dashboard/team-dropdown";

export default function PlayerVsTeamHub() {
  const router = useRouter();
  const [player, setPlayer] = useState("");
  const [team, setTeam] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player.trim() || !team.trim()) return;
    router.push(`/dashboard/analytics/matchups/pvt/${encodeURIComponent(player)}/${encodeURIComponent(team)}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-12 max-w-5xl mx-auto pt-12 pb-24">
      <div className="text-center space-y-4 w-full">
        <div className="mx-auto h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-lg">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold outfit-bold tracking-tight">Player vs Franchise</h1>
        <p className="inter-regular text-muted-foreground text-lg max-w-2xl mx-auto">
          Discover how a specific player performs against an entire team's bowling attack or batting lineup.
        </p>
      </div>

      <div className="w-full max-w-3xl mx-auto mt-8 bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-10">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <PlayerAutocomplete 
            label="Player"
            placeholder="e.g. MS Dhoni"
            value={player}
            onChange={setPlayer}
          />
          
          <div className="font-bold text-2xl text-muted-foreground/50 outfit-bold italic px-4">
            VS
          </div>
          
          <div className="w-full relative z-40">
            <TeamDropdown 
              label="Opponent Team"
              value={team}
              onChange={setTeam}
            />
          </div>
        </form>
        
        <div className="mt-8 flex justify-center">
          <button 
            type="submit"
            onClick={handleSearch} 
            disabled={!player || !team} 
            className="h-14 px-12 text-lg outfit-bold rounded-xl w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Franchise Matchup
          </button>
        </div>
      </div>
    </div>
  );
}
