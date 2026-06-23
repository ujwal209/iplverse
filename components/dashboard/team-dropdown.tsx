"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

import { getAllTeams } from "@/app/actions/games";

interface TeamDropdownProps {
  label: string;
  value: string;
  onChange: (team: string) => void;
}

export function TeamDropdown({ label, value, onChange }: TeamDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teamsDb, setTeamsDb] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function load() {
      const res = await getAllTeams();
      if (res.success && res.teams) {
        setTeamsDb(res.teams);
      }
    }
    load();
  }, []);

  const filteredTeams = teamsDb.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.short_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (teamName: string) => {
    onChange(teamName);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      
      {/* Selector Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-[60px] px-5 bg-muted/30 border ${isOpen ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border/60'} rounded-xl cursor-pointer transition-all hover:bg-muted/50`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <TeamAvatar name={value} imageUrl={teamsDb.find(t => t.name === value)?.image_url} />
            <span className="font-semibold text-lg text-foreground truncate">{value}</span>
          </div>
        ) : (
          <span className="text-muted-foreground inter-medium text-lg">Select IPL Franchise...</span>
        )}
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-background border border-border/50 shadow-2xl rounded-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          
          <div className="p-3 border-b border-border/50 bg-muted/20 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border/60 rounded-lg h-10 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {filteredTeams.length > 0 ? (
              filteredTeams.map((team) => (
                <div 
                  key={team.name}
                  onClick={() => handleSelect(team.name)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${value === team.name ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                >
                  <TeamAvatar name={team.short_name} imageUrl={team.image_url} />
                  <span className={`font-medium ${value === team.name ? 'outfit-bold' : 'inter-regular'}`}>{team.name}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">No teams found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple component for the Team Avatar without fetching images
function TeamAvatar({ name, imageUrl }: { name: string, imageUrl?: string }) {
  if (imageUrl) {
    return (
      <div className="h-8 w-8 bg-background rounded-full overflow-hidden flex-shrink-0 border border-primary/20 p-1">
        <img src={imageUrl} alt={name} className="object-contain w-full h-full" />
      </div>
    );
  }
  return (
    <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner flex-shrink-0 border border-primary/20">
      {name.substring(0, 2)}
    </div>
  );
}
