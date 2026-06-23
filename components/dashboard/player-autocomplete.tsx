"use client";
 
import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { searchPlayersFromDB } from "@/app/actions/games";
 
interface PlayerAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}
 
export function PlayerAutocomplete({ label, placeholder, value, onChange }: PlayerAutocompleteProps) {
  // If we receive an ID as value initially, we might want to fetch its name. 
  // For simplicity, we just keep query as text typed, and when selected, we set query to fullName.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false); // Flag to prevent reopen
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);
 
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1 && !query.match(/^[a-z0-9]{8}$/)) {
        const res = await searchPlayersFromDB(query);
        if (res.success && res.players) {
          setResults(res.players.slice(0, 10));
          setShowDropdown(true);
        } else {
          setResults([]);
        }
      } else {
        setResults([]);
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
 
  const handleSelect = (player: any) => {
    setIsSelecting(true);
    setQuery(player.name);
    onChange(player.name);
    setShowDropdown(false);
  };
 
  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input 
          type="text"
          value={query} 
          onChange={(e) => {
            setQuery(e.target.value);
            // If they clear the input, clear the parent value
            if (e.target.value === "") onChange("");
          }}
          onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          placeholder={placeholder} 
          className="w-full pl-12 pr-4 h-16 inter-regular text-xl rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>
 
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-xl overflow-hidden max-h-[300px] overflow-y-auto z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          {results.length > 0 ? (
            <div className="divide-y divide-border/40">
              {results.map((player, idx) => {
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleSelect(player)}
                    className="p-4 flex items-center justify-start gap-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-background overflow-hidden border border-border/50 shrink-0">
                      <img
                        src={player.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&color=fff&size=128`}
                        alt={player.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/players/default.png';
                        }}
                      />
                    </div>
                    <span className="font-semibold outfit-bold text-lg">{player.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground inter-regular text-sm">
              No players found matching "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
