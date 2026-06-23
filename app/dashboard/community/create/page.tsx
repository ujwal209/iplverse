"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Save } from "lucide-react";
import { searchLocalPlayers } from "@/app/actions/search";
import { createCommunityXI } from "@/app/actions/community";

export default function CreateXIPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length > 2) {
      setSearching(true);
      const res = await searchLocalPlayers(val);
      setResults(res.slice(0, 5));
      setSearching(false);
    } else {
      setResults([]);
    }
  };

  const handleAddPlayer = (player: any) => {
    if (selectedPlayers.length >= 11) {
      alert("You can only select up to 11 players!");
      return;
    }
    if (selectedPlayers.find(p => p.id === player.id)) {
      return;
    }
    setSelectedPlayers([...selectedPlayers, player]);
    setQuery("");
    setResults([]);
  };

  const handleRemovePlayer = (id: string) => {
    setSelectedPlayers(selectedPlayers.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your XI.");
      return;
    }
    if (selectedPlayers.length === 0) {
      alert("Please select at least one player.");
      return;
    }

    setSaving(true);
    // map to just player names or ids for the DB
    const playerNames = selectedPlayers.map(p => p.cricsheetName || p.displayName);
    const res = await createCommunityXI(title, playerNames);
    if (res.error) {
      alert("Error: " + res.error);
      setSaving(false);
    } else {
      router.push("/dashboard/community");
    }
  };

  return (
    <div className="flex flex-col min-h-[80vh] w-full p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black outfit-bold tracking-tight mb-2">Create All-Time XI</h1>
        <p className="text-muted-foreground inter-medium">
          Build your ultimate dream team and share it with the community.
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">XI Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Best Ever T20 Squad"
              className="w-full bg-muted border border-border/50 rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
              Select Players ({selectedPlayers.length}/11)
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a player..."
                className="w-full bg-muted border border-border/50 rounded-xl pl-12 pr-4 py-3 font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                disabled={selectedPlayers.length >= 11}
              />
              {searching && (
                <div className="absolute inset-y-0 right-4 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {results.length > 0 && (
              <div className="absolute z-10 mt-2 w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col">
                {results.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleAddPlayer(player)}
                    className="flex flex-col text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    <span className="font-bold">{player.displayName}</span>
                    <span className="text-xs text-muted-foreground">{player.cricsheetName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Players Grid */}
          <div className="mt-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedPlayers.map((player, idx) => (
                <div key={player.id} className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col relative group">
                  <span className="text-xs font-bold text-primary/50 mb-1">#{idx + 1}</span>
                  <span className="font-bold text-primary truncate" title={player.displayName}>
                    {player.displayName}
                  </span>
                  <button 
                    onClick={() => handleRemovePlayer(player.id)}
                    className="absolute top-2 right-2 bg-background rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {/* Empty slots placeholders */}
              {Array.from({ length: 11 - selectedPlayers.length }).map((_, i) => (
                <div key={`empty-${i}`} className="border-2 border-dashed border-border/50 rounded-xl p-4 flex flex-col justify-center items-center h-[82px] opacity-50">
                  <span className="text-xs font-bold text-muted-foreground">Empty Slot</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-8 border-t border-border/50 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving || selectedPlayers.length === 0 || !title.trim()}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Publish XI
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
