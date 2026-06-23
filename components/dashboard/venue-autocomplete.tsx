"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

const IPL_VENUES = [
  "Wankhede Stadium",
  "Eden Gardens",
  "M.Chinnaswamy Stadium",
  "MA Chidambaram Stadium",
  "Rajiv Gandhi International Stadium",
  "Arun Jaitley Stadium",
  "Narendra Modi Stadium",
  "Sawai Mansingh Stadium",
  "Punjab Cricket Association Stadium",
  "Maharashtra Cricket Association Stadium",
  "Brabourne Stadium",
  "Dr DY Patil Sports Academy",
  "Sardar Patel Stadium",
  "Holkar Cricket Stadium",
  "JSCA International Stadium Complex",
  "Green Park",
  "Himachal Pradesh Cricket Association Stadium",
  "Dubai International Cricket Stadium",
  "Sharjah Cricket Stadium",
  "Sheikh Zayed Stadium"
];

interface VenueAutocompleteProps {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}

export function VenueAutocomplete({ label, placeholder, value, onChange }: VenueAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length > 0) {
      const filtered = IPL_VENUES.filter(v => v.toLowerCase().includes(val.toLowerCase()));
      setResults(filtered.slice(0, 6));
      setShowDropdown(true);
    } else {
      setResults(IPL_VENUES.slice(0, 6));
      setShowDropdown(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    setQuery(name);
    onChange(name);
    setShowDropdown(false);
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input 
          type="text"
          value={query} 
          onChange={handleSearch}
          onFocus={() => { 
            setResults(query ? IPL_VENUES.filter(v => v.toLowerCase().includes(query.toLowerCase())).slice(0,6) : IPL_VENUES.slice(0, 6));
            setShowDropdown(true); 
          }}
          placeholder={placeholder} 
          className="w-full pl-12 pr-4 h-16 inter-regular text-xl rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-2xl rounded-xl overflow-hidden max-h-[300px] overflow-y-auto z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          {results.length > 0 ? (
            <div className="divide-y divide-border/40">
              {results.map((venue, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelect(venue)}
                  className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <span className="font-semibold outfit-bold text-lg">{venue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground inter-regular text-sm">
              No stadiums found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
