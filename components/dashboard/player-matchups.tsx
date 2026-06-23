"use client";

import { useState } from "react";
import { Shield, Swords, Activity, ChevronDown } from "lucide-react";
import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";
import { getPlayerVsTeam, getHeadToHead } from "@/app/actions/analytics";

import { TeamDropdown } from "@/components/dashboard/team-dropdown";

interface PlayerMatchupsProps {
  playerId: string;
  displayPlayerName: string;
}

export function PlayerMatchups({ playerId, displayPlayerName }: PlayerMatchupsProps) {
  const [activeTab, setActiveTab] = useState("team");
  
  // PvT State
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);

  // H2H State
  const [selectedBowlerId, setSelectedBowlerId] = useState("");
  const [loadingBowler, setLoadingBowler] = useState(false);
  const [h2hData, setH2hData] = useState<any>(null);

  const handleFetchTeam = async () => {
    if (!selectedTeam) return;
    setLoadingTeam(true);
    const res = await getPlayerVsTeam(playerId, selectedTeam);
    setTeamData(res.success ? res.data?.data : null);
    setLoadingTeam(false);
  };

  const handleFetchBowler = async () => {
    if (!selectedBowlerId) return;
    setLoadingBowler(true);
    const res = await getHeadToHead(playerId, selectedBowlerId);
    setH2hData(res.success ? res.data?.data : null);
    setLoadingBowler(false);
  };

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm mt-8 overflow-visible">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-2xl font-bold outfit-bold">
          <Activity className="h-6 w-6 text-primary" />
          Matchups Analysis
        </h3>
        <p className="text-sm text-muted-foreground inter-regular mt-1">
          Explore how {displayPlayerName} performs against specific franchises or individual opponents.
        </p>
      </div>

      <div className="overflow-visible">
        <div className="w-full">
          {/* Tabs List */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-full max-w-md mb-6 border border-border/50">
            <button
              onClick={() => setActiveTab("team")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'team' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Shield className="h-4 w-4" /> Vs Franchise
            </button>
            <button
              onClick={() => setActiveTab("h2h")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'h2h' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
            >
              <Swords className="h-4 w-4" /> Head to Head
            </button>
          </div>
          
          {/* Vs Franchise Tab */}
          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end relative z-40">
                <div className="w-full sm:w-1/2">
                  <TeamDropdown 
                    label="Opponent Team"
                    value={selectedTeam}
                    onChange={setSelectedTeam}
                  />
                </div>
                <button 
                  onClick={handleFetchTeam} 
                  disabled={!selectedTeam || loadingTeam} 
                  className="h-[60px] px-8 w-full sm:w-auto bg-primary text-primary-foreground font-bold outfit-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingTeam ? "Analyzing..." : "Analyze Matchup"}
                </button>
              </div>

              {teamData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <StatBox label="Innings" value={teamData.innings} />
                  <StatBox label="Runs" value={teamData.runs} highlight />
                  <StatBox label="Average" value={teamData.average || "-"} />
                  <StatBox label="Strike Rate" value={teamData.strike_rate || "-"} highlight />
                  <StatBox label="Highest Score" value={teamData.highest_score} />
                  <StatBox label="Wickets" value={teamData.wickets} />
                  <StatBox label="Economy" value={teamData.economy || "-"} />
                </div>
              ) : selectedTeam && !loadingTeam && (
                <div className="p-8 text-center text-muted-foreground bg-muted/20 border border-dashed border-border/50 rounded-xl">
                  No matchup data found against {selectedTeam}.
                </div>
              )}
            </div>
          )}

          {/* Head to Head Tab */}
          {activeTab === "h2h" && (
            <div className="space-y-6 overflow-visible">
              <div className="flex flex-col sm:flex-row gap-4 items-end overflow-visible relative z-50">
                <div className="w-full sm:w-1/2">
                  <PlayerAutocomplete 
                    label="Opponent Bowler"
                    placeholder="Search Bowler..."
                    value={selectedBowlerId}
                    onChange={setSelectedBowlerId}
                  />
                </div>
                <button 
                  onClick={handleFetchBowler} 
                  disabled={!selectedBowlerId || loadingBowler} 
                  className="h-16 px-8 w-full sm:w-auto bg-primary text-primary-foreground font-bold outfit-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingBowler ? "Analyzing..." : "Analyze Battle"}
                </button>
              </div>

              {h2hData ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                  <StatBox label="Runs Scored" value={h2hData.runs} highlight />
                  <StatBox label="Balls Faced" value={h2hData.balls} />
                  <StatBox label="Strike Rate" value={h2hData.strike_rate} highlight />
                  <StatBox label="Dismissals" value={h2hData.dismissals} highlight />
                  <StatBox label="Batting Avg" value={h2hData.average || "-"} />
                  <StatBox label="Fours" value={h2hData.fours} />
                  <StatBox label="Sixes" value={h2hData.sixes} />
                </div>
              ) : selectedBowlerId && !loadingBowler && (
                <div className="p-8 text-center text-muted-foreground bg-muted/20 border border-dashed border-border/50 rounded-xl relative z-10">
                  No historic encounters found against this bowler.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground inter-bold mb-1 truncate">{label}</p>
      <p className={`text-xl sm:text-2xl outfit-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
