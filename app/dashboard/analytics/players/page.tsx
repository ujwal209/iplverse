"use client";
 
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, ChevronRight } from "lucide-react";
import { searchPlayersWithWebSearch, fetchPlayerImage, AutocompletePlayer } from "@/app/actions/analytics";

export default function PlayersSearchHub() {
  const router = useRouter();
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
    // Redirect to the dedicated dynamic route
    router.push(`/dashboard/analytics/players/${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-12 max-w-4xl mx-auto pt-16 pb-24">
      {/* Title Header */}
      <div className="text-center space-y-3 w-full">
        <div className="mx-auto h-16 w-16 bg-[#0B2A96]/10 rounded-full flex items-center justify-center mb-4 border border-[#0B2A96]/20 shadow-xs">
          <Users className="h-8 w-8 text-[#0B2A96]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold outfit-bold tracking-tight text-[#0B2A96]">
          Player Analytics
        </h1>
        <p className="inter-regular text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
          Explore historic career profiles, advanced batting analysis, bowling metrics, and franchise records.
        </p>
      </div>
 
      {/* Search Input Box */}
      <div className="relative z-50 w-full" ref={dropdownRef}>
        <div className="relative">
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${
            isSearching ? 'text-[#0B2A96] animate-pulse' : 'text-slate-400'
          }`} />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            placeholder="Search for any player (e.g. Virat Kohli, MS Dhoni)..." 
            className="w-full pl-14 pr-12 h-14 inter-medium text-base sm:text-lg rounded-xl border border-slate-200 bg-white text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B2A96]/50 focus:border-[#0B2A96]/80 shadow-xs transition-all"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 rounded bg-slate-100 border border-slate-200"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Dynamic Auto-complete Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden max-h-[360px] overflow-y-auto z-50 animate-in slide-in-from-top-1 duration-150">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {searchResults.map((player, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectPlayer(player.dbName)}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <PlayerAvatar name={player.fullName} />
                      <div>
                        <h4 className="text-sm font-bold outfit-bold text-[#1E293B] group-hover:text-[#0B2A96] transition-colors">
                          {player.fullName}
                        </h4>
                        <p className="text-[11px] text-slate-400 inter-regular">View Complete Analytics Profile</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0B2A96] group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 inter-regular text-sm">
                No players found matching "{query}"
              </div>
            )}
          </div>
        )}
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
        if (isMounted) {
          setImgUrl(url);
        }
      } catch (err) {
        console.error("Error loading avatar:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadImage();
    return () => {
      isMounted = false;
    };
  }, [name]);
 
  if (loading) {
    return (
      <div className="h-10 w-10 bg-[#0B2A96]/5 rounded-full flex items-center justify-center text-[#0B2A96] font-bold outfit-bold text-sm uppercase shadow-inner animate-pulse flex-shrink-0">
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
        className="h-10 w-10 rounded-full object-cover shadow border border-slate-100 flex-shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
 
  return (
    <div className="h-10 w-10 bg-[#0B2A96]/5 rounded-full flex items-center justify-center text-[#0B2A96] font-bold outfit-bold text-sm uppercase shadow-inner flex-shrink-0">
      {name.charAt(0)}
    </div>
  );
}
