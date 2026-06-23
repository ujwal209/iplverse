"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Trophy, RotateCcw, Loader2, MapPin, CheckCircle2, XCircle } from "lucide-react";
import { submitDailyGame, getCareerPathClues, searchPlayersFromDB, getAllTeams } from "@/app/actions/games";
import confetti from "canvas-confetti";
import Image from "next/image";
import { GameHeader } from "@/components/game/game-header";

type TargetPlayer = {
  name: string;
  aliases: string[];
  journey: { year: string; team: string }[];
};

export default function CareerPath() {
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [targetPlayer, setTargetPlayer] = useState<TargetPlayer | null>(null);
  const [score, setScore] = useState(0);
  const [teamsDb, setTeamsDb] = useState<any[]>([]);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const MAX_GUESSES = 4;

  useEffect(() => {
    fetchNextPlayer();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNextPlayer = async () => {
    setLoadingMatch(true);
    setGameState('playing');
    setGuesses([]);
    setQuery("");
    
    // Fetch teams on first load
    if (teamsDb.length === 0) {
      const teamRes = await getAllTeams();
      if (teamRes.success && teamRes.teams) {
        setTeamsDb(teamRes.teams);
      }
    }
    
    const res = await getCareerPathClues();
    if (res.success && res.targetPlayer) {
      setTargetPlayer(res.targetPlayer);
    }
    
    setLoadingMatch(false);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      const res = await searchPlayersFromDB(val);
      if (res.success && res.players) {
        setSearchResults(res.players);
        setShowDropdown(true);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectPlayer = async (player: any) => {
    if (gameState !== 'playing') return;
    
    setQuery("");
    setShowDropdown(false);
    
    const guessedName = player.name;
    const newGuesses = [...guesses, guessedName];
    setGuesses(newGuesses);

    const isCorrect = 
      targetPlayer?.name.toLowerCase() === guessedName.toLowerCase() ||
      targetPlayer?.aliases.some(a => a.toLowerCase() === guessedName.toLowerCase());

    if (isCorrect) {
      setGameState('won');
      setScore(s => s + 1);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#ffffff']
      });
      // Try to save daily game
      try {
        await submitDailyGame("career-path", score + 1);
      } catch (e) {}
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameState('lost');
      setScore(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-10">
      <GameHeader 
        title="Career Path" 
        subtitle="Guess the player from their historic IPL career journey. Build your streak!"
      />

      <div className="flex justify-between items-center bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-xl text-primary shadow-inner">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-primary/80 uppercase tracking-widest font-bold">Current Streak</p>
            <p className="text-3xl font-heading text-primary drop-shadow-sm">{score}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* Journey Area */}
        <div className="flex-1 w-full space-y-6 md:order-first">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-md relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <MapPin className="h-6 w-6 text-primary" />
              <h2 className="text-xl sm:text-2xl font-heading uppercase tracking-widest text-foreground">Career Journey</h2>
            </div>
            
            <div className="space-y-4">
              {loadingMatch ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 sm:p-5 rounded-xl border border-border/50 flex items-center gap-4 bg-muted/20 animate-pulse">
                    <div className="shrink-0 p-2 bg-muted rounded-full h-12 w-12"></div>
                    <div className="space-y-2 w-full mt-1">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-5 bg-muted/50 rounded w-2/3"></div>
                    </div>
                  </div>
                ))
              ) : (
                targetPlayer?.journey.map((phase, idx) => {
                  const dbTeam = teamsDb.find(t => 
                    t.name.toLowerCase() === phase.team.toLowerCase() || 
                    t.short_name.toLowerCase() === phase.team.toLowerCase()
                  );
                  return (
                    <div 
                      key={idx}
                      className="p-4 sm:p-5 rounded-xl border border-primary/20 transition-all duration-500 flex items-center gap-4 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 hover:border-primary/40 animate-in slide-in-from-left-4"
                      style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                    >
                      <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden border border-border/50 bg-background flex items-center justify-center p-2">
                        {dbTeam?.image_url ? (
                          <img src={dbTeam.image_url} alt={phase.team} className="object-contain w-full h-full" />
                        ) : (
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-bold text-xs text-muted-foreground">{phase.team.substring(0,2).toUpperCase()}</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-primary/70 uppercase tracking-wider">{phase.year}</p>
                        <p className="font-heading text-lg text-foreground/90">{phase.team}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Interaction Area */}
        <div className="w-full md:w-[400px] flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-heading mb-4 text-foreground flex items-center justify-between">
              Make Your Guess
              <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {MAX_GUESSES - guesses.length} left
              </span>
            </h2>
            
            <div className="relative mb-6" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="e.g., MS Dhoni"
                  value={query}
                  onChange={handleSearch}
                  disabled={gameState !== 'playing' || loadingMatch}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-50"
                  autoComplete="off"
                />
              </div>
              
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {searchResults.map((player, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectPlayer(player)}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b border-border last:border-0 flex items-center gap-3 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-background overflow-hidden border border-border/50 shrink-0">
                        <img
                          src={player.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&color=fff&size=128`}
                          alt={player.name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/players/default.png';
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{player.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3">Your Guesses</p>
              {Array.from({ length: MAX_GUESSES }).map((_, i) => {
                const guess = guesses[i];
                const isCurrent = i === guesses.length;
                return (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all duration-300 ${
                      guess 
                        ? (guess.toLowerCase() === targetPlayer?.name.toLowerCase() || targetPlayer?.aliases.some(a => a.toLowerCase() === guess.toLowerCase()) ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-destructive/10 border-destructive/30 text-destructive")
                        : isCurrent ? "border-primary/50 bg-primary/5 shadow-sm scale-[1.02]" : "border-border/50 bg-background/50 text-muted-foreground"
                    }`}
                  >
                    <span className={`text-sm ${guess ? "font-medium" : "opacity-50"}`}>
                      {guess || "Empty Slot"}
                    </span>
                    {guess && (
                      (guess.toLowerCase() === targetPlayer?.name.toLowerCase() || targetPlayer?.aliases.some(a => a.toLowerCase() === guess.toLowerCase())) 
                        ? <CheckCircle2 className="h-5 w-5" /> 
                        : <XCircle className="h-5 w-5" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(gameState === 'won' || gameState === 'lost') && (
            <div className={`p-6 rounded-xl border flex flex-col items-center text-center animate-in zoom-in-95 duration-500 shadow-lg relative overflow-hidden ${
              gameState === 'won' 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-destructive/10 border-destructive/30'
            }`}>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-current opacity-5 rounded-full blur-3xl"></div>
              
              <p className="text-sm font-bold uppercase tracking-widest mb-1 opacity-80">
                {gameState === 'won' ? 'Brilliant!' : 'Game Over'}
              </p>
              <p className="text-2xl font-heading mb-6">
                {gameState === 'won' ? 'Spot On!' : `It was ${targetPlayer?.name}`}
              </p>
              
              <button
                onClick={fetchNextPlayer}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-transform hover:scale-[1.02] active:scale-95 shadow-md"
              >
                <RotateCcw className="h-5 w-5" />
                {gameState === 'won' ? 'Next Player' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
