"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Trophy, MapPin, Coins, Award, Sparkles, Target, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { getAllSearchableMatches, getMatchClues, submitDailyGame, getAllTeams } from "@/app/actions/games";
import confetti from "canvas-confetti";
import Fuse from "fuse.js";
import { GameHeader } from "@/components/game/game-header";

type MatchStub = {
  id: number;
  season: number;
  team1: string;
  team2: string;
  searchKey?: string;
};

type MatchDetails = {
  id: number;
  team1: string;
  team2: string;
  season: number;
  venue?: string;
  clues: { type: string, text: string }[];
};

export default function GuessTheMatch() {
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [score, setScore] = useState(0);
  
  const [allMatches, setAllMatches] = useState<MatchStub[]>([]);
  const fuseRef = useRef<Fuse<MatchStub> | null>(null);

  const [targetMatch, setTargetMatch] = useState<MatchDetails | null>(null);
  
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MatchStub[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [teamsDb, setTeamsDb] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [guesses, setGuesses] = useState<MatchStub[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    initGame();
  }, []);

  const initGame = async () => {
    setLoadingInitial(true);
    const [matchesRes, teamsRes] = await Promise.all([getAllSearchableMatches(), getAllTeams()]);
    
    if (matchesRes.success && matchesRes.matches) {
      const enriched = matchesRes.matches.map((m: any) => ({
        ...m,
        searchKey: `${m.season} ${m.team1} vs ${m.team2}`
      }));
      setAllMatches(enriched);
      fuseRef.current = new Fuse(enriched, {
        keys: ["searchKey", "team1", "team2", "season"],
        threshold: 0.4,
      });
      if (teamsRes.success) setTeamsDb(teamsRes.teams);
      fetchNextMatch(enriched);
    }
    setLoadingInitial(false);
  };

  const fetchNextMatch = async (matchesArray: MatchStub[]) => {
    setLoadingMatch(true);
    setGameOver(false);
    setHasWon(false);
    setGuesses([]);
    setQuery("");
    
    const randomStub = matchesArray[Math.floor(Math.random() * matchesArray.length)];
    const clueRes = await getMatchClues(randomStub.id);
    
    if (clueRes.success && clueRes.match) {
      setTargetMatch(clueRes.match);
    }
    setLoadingMatch(false);
  };

  useEffect(() => {
    if (!gameOver && !animating && fuseRef.current) {
      if (query.trim().length > 0) {
        const results = fuseRef.current.search(query).slice(0, 50).map(res => res.item);
        setSearchResults(results);
      } else {
        setSearchResults(allMatches.slice(0, 50));
      }
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [query, gameOver, animating, allMatches]);

  const handleGuess = (guessedMatch: MatchStub) => {
    if (gameOver || animating || !targetMatch) return;

    setShowDropdown(false);
    setQuery("");
    
    const isCorrect = guessedMatch.id === targetMatch.id;
    
    if (isCorrect) {
      setAnimating(true);
      setHasWon(true);
      setScore(s => s + 1);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#0B2A96', '#10B981', '#ffffff'] });
      setTimeout(() => {
        setAnimating(false);
        setGameOver(true);
        submitDailyGame("guess_match", score, true);
      }, 2000);
    } else {
      if (!guesses.find(g => g.id === guessedMatch.id)) {
        const newGuesses = [...guesses, guessedMatch];
        setGuesses(newGuesses);
        if (newGuesses.length >= 4) {
          setGameOver(true);
          setHasWon(false);
          submitDailyGame("guess_match", score, false);
        }
      }
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <Target className="h-16 w-16 text-primary animate-bounce mb-4" />
        <h2 className="text-2xl font-heading text-muted-foreground animate-pulse">Initializing Game...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto w-full min-h-[80vh] flex flex-col">
      <GameHeader title="Guess The Match" subtitle="Identify the historic IPL match from the dynamic clues." />

      <div className="flex-1 w-full flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        <div className="flex-1 w-full space-y-6 md:order-first">
          {gameOver ? (
            <div className={`p-6 sm:p-8 rounded-2xl border text-center animate-in zoom-in-95 duration-500 shadow-xl relative overflow-hidden ${hasWon ? 'bg-gradient-to-b from-green-500/10 to-green-500/5 border-green-500/30' : 'bg-gradient-to-b from-destructive/10 to-destructive/5 border-destructive/30'}`}>
              {targetMatch && (
                <div className="flex justify-center items-center gap-6 mb-6">
                  {(() => {
                    const t1 = teamsDb.find(t => t.name === targetMatch.team1 || t.short_name === targetMatch.team1);
                    const t2 = teamsDb.find(t => t.name === targetMatch.team2 || t.short_name === targetMatch.team2);
                    return (
                      <>
                        {t1?.image_url && <img src={t1.image_url} alt={targetMatch.team1} className="w-20 h-20 object-contain drop-shadow-xl animate-in slide-in-from-left" />}
                        <span className="text-2xl font-bold italic text-muted-foreground/50 uppercase">VS</span>
                        {t2?.image_url && <img src={t2.image_url} alt={targetMatch.team2} className="w-20 h-20 object-contain drop-shadow-xl animate-in slide-in-from-right" />}
                      </>
                    )
                  })()}
                </div>
              )}
              <p className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80 text-foreground">{hasWon ? 'Brilliant Guess!' : 'Game Over'}</p>
              <p className="text-xl sm:text-2xl font-heading mb-6 text-foreground drop-shadow-sm">{hasWon ? 'Spot On!' : `It was ${targetMatch?.team1} vs ${targetMatch?.team2} (${targetMatch?.season})`}</p>
              <button onClick={() => fetchNextMatch(allMatches)} className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90">Next Match</button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-md h-full">
              <div className="flex items-center gap-3 mb-6"><Search className="h-6 w-6 text-primary" /><h2 className="text-xl sm:text-2xl font-heading uppercase tracking-widest">Match Clues</h2></div>
              <div className="space-y-4">
                {loadingMatch ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-xl" />) : targetMatch?.clues.map((clue, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex items-start gap-4">
                    <div className="shrink-0 mt-0.5 p-2 bg-background rounded-lg border border-primary/20">
                      {clue.type === 'venue' && <MapPin className="h-5 w-5 text-primary" />}
                      {clue.type === 'toss' && <Coins className="h-5 w-5 text-primary" />}
                      {clue.type === 'pom' && <Award className="h-5 w-5 text-primary" />}
                      {clue.type === 'fact' && <Sparkles className="h-5 w-5 text-primary" />}
                    </div>
                    <p className="font-medium text-sm sm:text-base">{clue.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-[400px] flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-heading mb-4 uppercase tracking-widest text-muted-foreground">Make Your Guess</h2>
            <div className="relative" ref={dropdownRef}>
              <input 
                type="text"
                placeholder="Search match..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-muted/50 border border-border rounded-full py-3 px-12"
              />
              {showDropdown && searchResults.length > 0 && !gameOver && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-20">
                  <div className="max-h-64 overflow-y-auto p-2">
                    {searchResults.map((match, idx) => {
                      const t1 = teamsDb.find(t => t.name === match.team1 || t.short_name === match.team1);
                      const t2 = teamsDb.find(t => t.name === match.team2 || t.short_name === match.team2);
                      return (
                      <button key={idx} onClick={() => handleGuess(match)} className="w-full text-left px-4 py-3 hover:bg-muted/50 rounded-lg flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {t1?.image_url ? <img src={t1.image_url} alt={match.team1} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-muted rounded-full" />}
                            <span className="text-[10px] font-bold">VS</span>
                            {t2?.image_url ? <img src={t2.image_url} alt={match.team2} className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 bg-muted rounded-full" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{t1?.short_name || match.team1} vs {t2?.short_name || match.team2}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{match.season} • {match.venue || "T20 Match"}</p>
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8">
              <h3 className="text-sm font-heading uppercase text-muted-foreground mb-3 sm:mb-4 tracking-wider">Your Guesses ({guesses.length}/4)</h3>
              <div className="space-y-2 sm:space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`p-3 sm:p-4 rounded-xl border flex items-center justify-between text-sm sm:text-base ${
                      i < guesses.length 
                        ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                        : 'bg-muted/10 border-border border-dashed text-muted-foreground/50'
                    }`}
                  >
                    {i < guesses.length ? (() => {
                      const ht1 = teamsDb.find(t => t.name === guesses[i].team1 || t.short_name === guesses[i].team1);
                      const ht2 = teamsDb.find(t => t.name === guesses[i].team2 || t.short_name === guesses[i].team2);
                      return (
                      <>
                        <span className="font-semibold">{guesses[i].season} • {ht1?.short_name || guesses[i].team1} vs {ht2?.short_name || guesses[i].team2}</span>
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                      </>
                    )})() : (
                      <span>Empty Slot</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {gameOver && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-primary/10 border border-primary/20 rounded-xl text-center animate-in zoom-in-95 duration-500">
                <h3 className="text-xl sm:text-2xl font-heading text-primary mb-2">Game Over!</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  The correct match was <strong className="text-foreground">{targetMatch?.season} {targetMatch?.team1} vs {targetMatch?.team2}</strong>
                </p>
                <button 
                  onClick={handleRestart}
                  className="w-full py-3 sm:py-4 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Try Again
                </button>
              </div>
            )}
            
            {animating && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-green-500/10 border border-green-500/20 rounded-xl text-center animate-in zoom-in-95 duration-500">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-heading text-green-500 mb-2">Correct!</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Streak increased! Loading next match...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
