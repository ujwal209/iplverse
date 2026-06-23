"use client";

import { useState, useEffect, useRef } from "react";
import { BarChart3, TrendingUp, ChevronDown, Search, ChevronRight } from "lucide-react";
import { getBattingLeaders, getBowlingLeaders, searchPlayersWithWebSearch, fetchPlayerImage, AutocompletePlayer } from "@/app/actions/analytics";
import { useRouter } from "next/navigation";

export default function LeaderboardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"batting" | "bowling">("batting");
  const [battingData, setBattingData] = useState<any[]>([]);
  const [bowlingData, setBowlingData] = useState<any[]>([]);

  const [battingMetric, setBattingMetric] = useState("runs");
  const [bowlingMetric, setBowlingMetric] = useState("wickets");
  
  // Pagination State
  const [battingPage, setBattingPage] = useState(1);
  const [bowlingPage, setBowlingPage] = useState(1);
  const [battingTotal, setBattingTotal] = useState(0);
  const [bowlingTotal, setBowlingTotal] = useState(0);
  const limit = 10;

  // Search State
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AutocompletePlayer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsSearching(true);
        const res = await searchPlayersWithWebSearch(query);
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
 
    return () => clearTimeout(delayDebounceFn);
  }, [query]);
 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlayer = (playerName: string) => {
    setShowDropdown(false);
    router.push(`/dashboard/analytics/players/${encodeURIComponent(playerName)}`);
  };

  useEffect(() => {
    setBattingPage(1);
    loadBattingLeaders(1);
  }, [battingMetric]);

  useEffect(() => {
    setBowlingPage(1);
    loadBowlingLeaders(1);
  }, [bowlingMetric]);

  useEffect(() => {
    loadBattingLeaders(battingPage);
  }, [battingPage]);

  useEffect(() => {
    loadBowlingLeaders(bowlingPage);
  }, [bowlingPage]);

  const loadBattingLeaders = async (pageToLoad: number) => {
    setLoading(true);
    const offset = (pageToLoad - 1) * limit;
    const res = await getBattingLeaders(battingMetric, limit, offset);
    if (res.success) {
      const dataArray = res.data.data || [];
      setBattingData(dataArray);
      setBattingTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  const loadBowlingLeaders = async (pageToLoad: number) => {
    setLoading(true);
    const offset = (pageToLoad - 1) * limit;
    const res = await getBowlingLeaders(bowlingMetric, limit, offset);
    if (res.success) {
      const dataArray = res.data.data || [];
      setBowlingData(dataArray);
      setBowlingTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  const renderSkeletons = () => (
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded"></div>
              <div className="h-3 w-16 bg-muted/50 rounded"></div>
            </div>
          </div>
          <div className="space-y-2 text-right flex flex-col items-end">
            <div className="h-5 w-12 bg-muted rounded"></div>
            <div className="h-3 w-16 bg-muted/50 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-3xl">Global Leaderboards</h1>
          <p className="text-body text-muted-foreground mt-2">
            The all-time greats sorted by advanced metrics.
          </p>
        </div>

        {/* Global Player Search Bar */}
        <div className="relative w-full md:w-80 z-50" ref={dropdownRef}>
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
              isSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'
            }`} />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              placeholder="Search any player..." 
              className="w-full pl-10 pr-10 h-12 inter-medium text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted"
              >
                CLEAR
              </button>
            )}
          </div>
          
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-1">
              {searchResults.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {searchResults.map((player, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSelectPlayer(player.dbName)}
                      className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <PlayerAvatar name={player.fullName} />
                        <h4 className="text-sm font-bold outfit-bold text-foreground group-hover:text-primary transition-colors">
                          {player.fullName}
                        </h4>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No players found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex bg-muted/30 p-1 rounded-2xl max-w-md mb-8">
        <button
          onClick={() => setActiveTab("batting")}
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "batting" 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Batting
        </button>
        <button
          onClick={() => setActiveTab("bowling")}
          className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "bowling" 
              ? "bg-card text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bowling
        </button>
      </div>

      {activeTab === "batting" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-border/40 gap-4">
            <div className="flex items-center gap-2 font-heading text-xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Top Batters
            </div>
            <div className="relative">
              <select
                value={battingMetric}
                onChange={(e) => setBattingMetric(e.target.value)}
                className="appearance-none bg-background border border-border/60 text-foreground text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer font-medium"
              >
                <option value="runs">Total Runs</option>
                <option value="batting_average">Batting Average</option>
                <option value="batting_strike_rate">Strike Rate</option>
                <option value="sixes">Total 6s</option>
                <option value="fours">Total 4s</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            {loading ? renderSkeletons() : battingData.length > 0 ? (
              <div className="divide-y divide-border/40">
                {battingData.map((player: any, idx: number) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;
                  let rankColor = "text-muted-foreground";
                  if (isGold) rankColor = "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]";
                  else if (isSilver) rankColor = "text-muted-foreground drop-shadow-[0_0_8px_rgba(156,163,175,0.3)]";
                  else if (isBronze) rankColor = "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]";

                  const playerName = player.players?.name || player.player_name || player.batter || player.player_id;

                  return (
                    <a 
                      key={idx} 
                      href={`/dashboard/analytics/players/${encodeURIComponent(playerName)}`}
                      className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-all duration-300 group cursor-pointer block hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <span className={`w-8 sm:w-12 text-center font-heading text-xl sm:text-2xl ${rankColor}`}>
                          #{(battingPage - 1) * limit + idx + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <PlayerAvatar name={playerName} />
                          <div>
                            <p className="font-heading text-lg group-hover:text-primary transition-colors">{playerName}</p>
                            <p className="text-caption mt-1">{player.matches || 0} Matches Played</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-display text-2xl sm:text-3xl ${isGold ? 'text-yellow-500' : 'text-primary group-hover:text-primary/80'}`}>
                          {player[battingMetric]}
                        </span>
                        <p className="text-caption uppercase tracking-wider font-bold mt-1">
                          {battingMetric.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground bg-card/50 m-4 rounded-xl border border-dashed border-border/50">
                No data available for this metric.
              </div>
            )}
            
            {/* Pagination Controls */}
            {battingTotal > limit && (
              <div className="flex items-center justify-between p-6 border-t border-border/40">
                <button
                  onClick={() => setBattingPage(p => Math.max(1, p - 1))}
                  disabled={battingPage === 1}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {battingPage} of {Math.ceil(battingTotal / limit)}
                </span>
                <button
                  onClick={() => setBattingPage(p => p + 1)}
                  disabled={battingPage >= Math.ceil(battingTotal / limit)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "bowling" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-border/40 gap-4">
            <div className="flex items-center gap-2 font-heading text-xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Top Bowlers
            </div>
            <div className="relative">
              <select
                value={bowlingMetric}
                onChange={(e) => setBowlingMetric(e.target.value)}
                className="appearance-none bg-background border border-border/60 text-foreground text-sm rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer font-medium"
              >
                <option value="wickets">Total Wickets</option>
                <option value="economy">Economy Rate</option>
                <option value="bowling_average">Bowling Average</option>
                <option value="bowling_strike_rate">Strike Rate</option>
                <option value="dot_ball_percentage">Dot Ball %</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            {loading ? renderSkeletons() : bowlingData.length > 0 ? (
              <div className="divide-y divide-border/40">
                {bowlingData.map((player: any, idx: number) => {
                  const isGold = idx === 0;
                  const isSilver = idx === 1;
                  const isBronze = idx === 2;
                  let rankColor = "text-muted-foreground";
                  if (isGold) rankColor = "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]";
                  else if (isSilver) rankColor = "text-muted-foreground drop-shadow-[0_0_8px_rgba(156,163,175,0.3)]";
                  else if (isBronze) rankColor = "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]";

                  const playerName = player.players?.name || player.player_name || player.bowler || player.player_id;

                  return (
                    <a 
                      key={idx} 
                      href={`/dashboard/analytics/players/${encodeURIComponent(playerName)}`}
                      className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-all duration-300 group cursor-pointer block hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <span className={`w-8 sm:w-12 text-center font-heading text-xl sm:text-2xl ${rankColor}`}>
                          #{(bowlingPage - 1) * limit + idx + 1}
                        </span>
                        <div className="flex items-center gap-3">
                          <PlayerAvatar name={playerName} />
                          <div>
                            <p className="font-heading text-lg group-hover:text-primary transition-colors">{playerName}</p>
                            <p className="text-caption mt-1">{player.matches || 0} Matches Played</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-display text-2xl sm:text-3xl ${isGold ? 'text-yellow-500' : 'text-primary group-hover:text-primary/80'}`}>
                          {player[bowlingMetric]}
                        </span>
                        <p className="text-caption uppercase tracking-wider font-bold mt-1">
                          {bowlingMetric.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground bg-card/50 m-4 rounded-xl border border-dashed border-border/50">
                No data available for this metric.
              </div>
            )}
            
            {/* Pagination Controls */}
            {bowlingTotal > limit && (
              <div className="flex items-center justify-between p-6 border-t border-border/40">
                <button
                  onClick={() => setBowlingPage(p => Math.max(1, p - 1))}
                  disabled={bowlingPage === 1}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {bowlingPage} of {Math.ceil(bowlingTotal / limit)}
                </span>
                <button
                  onClick={() => setBowlingPage(p => p + 1)}
                  disabled={bowlingPage >= Math.ceil(bowlingTotal / limit)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerAvatar({ name }: { name: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      try {
        const url = await fetchPlayerImage(name);
        if (isMounted) setImgUrl(url);
      } catch (err) {
        console.error("Error loading avatar:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadImage();
    return () => { isMounted = false; };
  }, [name]);
 
  if (loading) {
    return (
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold outfit-bold text-sm uppercase animate-pulse flex-shrink-0">
        {name.charAt(0)}
      </div>
    );
  }
 
  if (imgUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imgUrl}
        alt={name}
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow border border-border/50 bg-card flex-shrink-0"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
 
  return (
    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold outfit-bold text-sm uppercase flex-shrink-0">
      {name.charAt(0)}
    </div>
  );
}
