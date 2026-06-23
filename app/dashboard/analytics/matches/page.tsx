"use client";

import { useState, useEffect } from "react";
import { CalendarDays, MapPin, Trophy, Star } from "lucide-react";
import { getMatches } from "@/app/actions/analytics";
import { getAllTeams } from "@/app/actions/games";
import Link from "next/link";

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [teamsDb, setTeamsDb] = useState<any[]>([]);
  const limit = 20;

  useEffect(() => {
    loadMatches(page);
  }, [page]);

  const loadMatches = async (pageToLoad: number) => {
    setLoading(true);
    if (teamsDb.length === 0) {
      const tRes = await getAllTeams();
      if (tRes.success && tRes.teams) setTeamsDb(tRes.teams);
    }
    const offset = (pageToLoad - 1) * limit;
    const res = await getMatches(limit, offset);
    if (res.success) {
      setMatches(res.data.data || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  const renderSkeletons = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-display text-3xl">All Matches</h1>
        <p className="text-body text-muted-foreground mt-2">
          A complete history of every IPL match played.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-0">
          {loading ? (
            <div className="p-6">{renderSkeletons()}</div>
          ) : matches.length > 0 ? (
            <div className="divide-y divide-border/40">
              {matches.map((match: any, idx: number) => (
                <div key={idx} className="p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  
                  {/* Left Column: Teams & Winner */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <CalendarDays className="h-4 w-4" />
                      {match.match_date ? new Date(match.match_date).toLocaleDateString() : 'Unknown Date'}
                      <span className="mx-2">•</span>
                      <MapPin className="h-4 w-4" />
                      {match.venue || match.city || 'Unknown Venue'}
                    </div>
                    
                    <div className="font-heading text-xl flex items-center gap-3">
                      {(() => {
                        const t1 = teamsDb.find(t => t.name === match.team1 || t.short_name === match.team1);
                        const t2 = teamsDb.find(t => t.name === match.team2 || t.short_name === match.team2);
                        return (
                          <>
                            {t1?.image_url && <img src={t1.image_url} alt={match.team1} className="w-8 h-8 object-contain shrink-0" />}
                            <span className={match.winner === match.team1 ? "text-primary" : "text-foreground"}>{match.team1}</span>
                            <span className="text-muted-foreground text-sm px-2">vs</span>
                            {t2?.image_url && <img src={t2.image_url} alt={match.team2} className="w-8 h-8 object-contain shrink-0" />}
                            <span className={match.winner === match.team2 ? "text-primary" : "text-foreground"}>{match.team2}</span>
                          </>
                        )
                      })()}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{match.winner}</span>
                      <span className="text-muted-foreground">
                        won by {match.win_by_runs ? `${match.win_by_runs} runs` : match.win_by_wickets ? `${match.win_by_wickets} wickets` : 'unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Player of the Match */}
                  {match.player_of_match && (
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50 min-w-[250px]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Player of the Match
                      </div>
                      {match.player_of_match_id ? (
                        <Link 
                          href={`/dashboard/analytics/players/${encodeURIComponent(match.player_of_match_id)}`}
                          className="font-heading text-lg hover:text-primary transition-colors flex items-center gap-3 group"
                        >
                          {match.player_of_match_image && (
                            <img src={match.player_of_match_image} alt={match.player_of_match} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                          )}
                          {match.player_of_match}
                          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3">
                          {match.player_of_match_image && (
                            <img src={match.player_of_match_image} alt={match.player_of_match} className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                          )}
                          <span className="font-heading text-lg">{match.player_of_match}</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No matches found.
            </div>
          )}

          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex items-center justify-between p-6 border-t border-border/40 bg-muted/10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
