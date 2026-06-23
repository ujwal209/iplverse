"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Search, ChevronRight } from "lucide-react";
import { getTopPartnerships, searchPlayersWithWebSearch, fetchPlayerImage, AutocompletePlayer } from "@/app/actions/analytics";
import { useRouter } from "next/navigation";

export default function PartnershipsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [partnerships, setPartnerships] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Search State
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AutocompletePlayer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPartnerships(page);
  }, [page]);

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

  const loadPartnerships = async (pageToLoad: number) => {
    setLoading(true);
    const offset = (pageToLoad - 1) * limit;
    const res = await getTopPartnerships(limit, offset);
    if (res.success) {
      setPartnerships(res.data.data || []);
      setTotal(res.data.total || 0);
    }
    setLoading(false);
  };

  const handleSelectPlayer = (playerName: string) => {
    setShowDropdown(false);
    router.push(`/dashboard/analytics/players/${encodeURIComponent(playerName)}`);
  };

  const renderSkeletons = () => (
    <div className="p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between animate-pulse p-4 rounded-xl border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-muted rounded-full"></div>
            <div className="w-12 h-12 bg-muted rounded-full -ml-6 border-2 border-background"></div>
            <div className="space-y-2 ml-2">
              <div className="h-5 w-40 bg-muted rounded"></div>
              <div className="h-4 w-24 bg-muted/50 rounded"></div>
            </div>
          </div>
          <div className="space-y-2 text-right flex flex-col items-end">
            <div className="h-6 w-16 bg-muted rounded"></div>
            <div className="h-3 w-20 bg-muted/50 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display text-3xl flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Greatest Partnerships
          </h1>
          <p className="text-body text-muted-foreground mt-2">
            The most prolific batting duos in IPL history, ranked by total partnership runs.
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

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border/40 bg-muted/20">
          <h3 className="font-heading text-xl">Top 50 Partnerships</h3>
        </div>
        
        <div>
          {loading ? renderSkeletons() : partnerships.length > 0 ? (
            <div className="divide-y divide-border/40">
              {partnerships.map((duo: any, idx: number) => {
                const isGold = idx === 0;
                const isSilver = idx === 1;
                const isBronze = idx === 2;
                let rankColor = "text-muted-foreground";
                if (isGold) rankColor = "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]";
                else if (isSilver) rankColor = "text-muted-foreground drop-shadow-[0_0_8px_rgba(156,163,175,0.3)]";
                else if (isBronze) rankColor = "text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.3)]";

                return (
                  <div key={idx} className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className={`w-8 text-center font-heading text-xl sm:text-2xl ${rankColor}`}>
                        #{(page - 1) * limit + idx + 1}
                      </span>
                      
                      <div className="flex items-center">
                        <div className="flex -space-x-4">
                          <PlayerAvatar name={duo.partner_a_name} />
                          <div className="relative z-10 border-2 border-card rounded-full shadow-sm">
                            <PlayerAvatar name={duo.partner_b_name} />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="font-heading text-lg text-foreground">
                            {duo.partner_a_name} <span className="text-muted-foreground text-sm font-normal mx-1">&</span> {duo.partner_b_name}
                          </p>
                          <p className="text-caption mt-1 text-muted-foreground">
                            {duo.matches} Innings • Avg {duo.average_partnership || "-"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-display text-2xl sm:text-3xl ${isGold ? 'text-yellow-500' : 'text-primary'}`}>
                        {duo.partnership_runs}
                      </span>
                      <p className="text-caption uppercase tracking-wider font-bold mt-1 text-muted-foreground">
                        Total Runs
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No partnership data available.
            </div>
          )}
          
          {/* Pagination Controls */}
          {total > limit && (
            <div className="flex items-center justify-between p-6 border-t border-border/40">
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
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold outfit-bold text-sm uppercase animate-pulse">
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
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow border border-border/50 bg-card"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
 
  return (
    <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold outfit-bold text-sm uppercase">
      {name.charAt(0)}
    </div>
  );
}
