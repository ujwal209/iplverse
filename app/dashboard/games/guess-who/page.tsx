"use client";

import { useState, useEffect, useRef } from "react";
import { Gamepad2, Search, ArrowRight, RotateCcw, Shield, Swords, Info, Target, TrendingUp, Zap, Star, Award, ChevronDown, Activity, Sparkles, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { getBattingLeaders, getPlayerCareer, getAdvancedBatting, getAdvancedBowling, fetchPlayerImage } from "@/app/actions/analytics";
import { submitDailyGame, searchPlayersFromDB, getPlayerAIHints } from "@/app/actions/games";
import players from "@/lib/data/players.json";
import playerMappings from "@/lib/data/player-mappings.json";
import milestones from "@/lib/data/milestones.json";
import careerJourneys from "@/lib/data/career-journeys.json";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface GuessRecord {
  name: string;
  runs: number;
  matches: number;
  wickets: number;
  centuries: number;
  isCorrect: boolean;
}

export default function GuessThePlayerGame() {
  const [loading, setLoading] = useState(true);
  const [playerPool, setPlayerPool] = useState<any[]>([]);
  
  // Game State
  const [mysteryPlayer, setMysteryPlayer] = useState<any | null>(null);
  const [mysteryStats, setMysteryStats] = useState<any>(null);
  const [mysteryBatting, setMysteryBatting] = useState<any>(null);
  const [mysteryBowling, setMysteryBowling] = useState<any>(null);
  const [mysteryMilestones, setMysteryMilestones] = useState<any>(null);
  const [mysteryImage, setMysteryImage] = useState<string | null>(null);
  const [mysteryTeamsCount, setMysteryTeamsCount] = useState<number>(0);
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [guessHistory, setGuessHistory] = useState<GuessRecord[]>([]);
  const [isGuessing, setIsGuessing] = useState(false);

  // Progressive Reveal State
  const [aiHints, setAiHints] = useState<string[] | null>(null);
  const [loadingAiHints, setLoadingAiHints] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('guessWhoBestStreak');
    if (saved) setBestStreak(parseInt(saved, 10));
  }, []);

  // Search State for Guessing
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load pool on mount
  useEffect(() => {
    async function initGame() {
      let poolPlayers: any[] = [];
      try {
        const res = await getBattingLeaders("runs", 100);
        if (res.success) {
          const data = res.data.data || res.data.results || res.data.leaders || (Array.isArray(res.data) ? res.data : []);
          poolPlayers = data.map((p: any) => ({
             id: p.player_id,
             name: p.players?.name || p.player_name || p.batter
          })).filter((p: any) => p.id && p.name);
        }
      } catch (err) {
        console.error("Failed to load batting leaders:", err);
      }

      if (poolPlayers.length === 0) {
        // Fallback static list mapped to their known Cricsheet IDs or names
        poolPlayers = players.map((p: any) => ({ id: p.cricsheet_name || p.name, name: p.name }));
      }

      setPlayerPool(poolPlayers);
      startNewRound(poolPlayers);
    }
    initGame();
  }, []);

  // Fetch Progressive Clues when wrong guesses increase
  useEffect(() => {
    if (wrongGuesses >= 1 && !aiHints && !loadingAiHints && mysteryPlayer && mysteryPlayer.name && !isRevealed) {
      setLoadingAiHints(true);
      getPlayerAIHints(mysteryPlayer.name).then(res => {
        setAiHints(res.success && res.hints ? res.hints : []);
        setLoadingAiHints(false);
      });
    }
  }, [wrongGuesses, mysteryPlayer, isRevealed, aiHints, loadingAiHints]);

  // Also fetch all missing clues immediately upon reveal
  useEffect(() => {
    if (isRevealed && mysteryPlayer) {
      if (!aiHints && !loadingAiHints && mysteryPlayer?.name) {
        setLoadingAiHints(true);
        getPlayerAIHints(mysteryPlayer.name).then(res => {
          setAiHints(res.success && res.hints ? res.hints : []);
          setLoadingAiHints(false);
        });
      }
    }
  }, [isRevealed, mysteryPlayer, aiHints, loadingAiHints]);

  const startNewRound = async (pool: any[] = playerPool) => {
    if (pool.length === 0) return;
    setLoading(true);
    setIsRevealed(false);
    setWrongGuesses(0);
    setGuessHistory([]);
    setQuery("");
    
    if (wrongGuesses >= 3) {
      setStreak(0);
    }
    setAiHints(null);
    setLoadingAiHints(false);

    // Pick random player
    const randomIdx = Math.floor(Math.random() * Math.min(50, pool.length)); 
    const target = pool[randomIdx];
    setMysteryPlayer(target);

    const mapping = playerMappings.find((p: any) => p.cricsheet_name === target.name || p.display_name === target.name);
    const displayName = mapping ? mapping.display_name : target.name;

    // Fetch clues
    let career = null;
    let batting = null;
    let bowling = null;
    let img = null;

    try {
      const [careerRes, battingRes, bowlingRes, imgRes] = await Promise.all([
        getPlayerCareer(target.id),
        getAdvancedBatting(target.id),
        getAdvancedBowling(target.id),
        fetchPlayerImage(target.name)
      ]);
      career = careerRes.success ? careerRes.data?.data || careerRes.data : null;
      batting = battingRes.success ? battingRes.data?.data || battingRes.data : null;
      bowling = bowlingRes.success ? bowlingRes.data?.data || bowlingRes.data : null;
      img = imgRes;
    } catch (err) {
      console.error("Failed to load player clues from API:", err);
    }

    const milestoneData = (milestones as any)[displayName];
    setMysteryMilestones(milestoneData);
    
    if (!career && milestoneData) {
      career = {
        matches: milestoneData.matches || Math.round((milestoneData.total_runs || 0) / 32 + 25),
        runs: milestoneData.total_runs || 0,
        wickets: milestoneData.total_wickets || 0
      };
    }

    setMysteryStats(career);
    setMysteryBatting(batting);
    setMysteryBowling(bowling);
    setMysteryImage(img || (mapping?.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName) + "&background=random&color=fff&size=128"));
    
    // Calculate teams count
    const careerTimeline = (careerJourneys as any)[displayName];
    const teams = new Set<string>();
    if (mapping?.team) teams.add(mapping.team);
    if (milestoneData?.teams_played_for) {
      milestoneData.teams_played_for.forEach((t: string) => teams.add(t));
    }
    if (careerTimeline) {
      careerTimeline.forEach((item: any) => teams.add(item.team));
    }
    setMysteryTeamsCount(teams.size || 1);

    setLoading(false);
  };

  // Fast local fuzzy search for guessing
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        const res = await searchPlayersFromDB(query);
        if (res.success && res.players) {
          setSearchResults(res.players.slice(0, 10));
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGuess = async (player: any) => {
    if (isRevealed || isGuessing) return;
    
    setIsGuessing(true);
    setShowDropdown(false);
    setQuery("");
    
    const isCorrect = player.id === mysteryPlayer.id;
    
    // Fetch live stats for guessed player because milestones.json only has 12 entries
    let career = null;
    try {
      const careerRes = await getPlayerCareer(player.id);
      career = careerRes.success ? (careerRes.data?.data || careerRes.data) : null;
    } catch(err) {
      console.error(err);
    }
    
    let runs = career?.runs || 0;
    let matches = career?.matches || 0;
    let wickets = career?.wickets || 0;
    let centuries = career?.hundreds || 0;
    
    // Safety fallback for matches if missing
    if (matches === 0 && runs > 0) matches = Math.round(runs / 30);
    
    const newRecord: GuessRecord = {
      name: player.name,
      runs,
      matches,
      wickets,
      centuries,
      isCorrect
    };

    setGuessHistory(prev => [newRecord, ...prev]);

    if (isCorrect) {
      setIsRevealed(true);
      setStreak(prev => {
        const n = prev + 1;
        if (n > bestStreak) {
          setBestStreak(n);
          localStorage.setItem('guessWhoBestStreak', n.toString());
        }
        return n;
      });
      submitDailyGame("guess_who", 100 - (wrongGuesses * 20), true);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#fbbf24', '#ffffff']
      });
    } else {
      setWrongGuesses(prev => prev + 1);
      
      // Auto-reveal if 3 wrong guesses
      if (wrongGuesses >= 2) {
        setIsRevealed(true);
        submitDailyGame("guess_who", 0, false);
      }
    }
    setIsGuessing(false);
  };

  // Radar Chart Data Calculation
  const radarData = [];
  if (mysteryBatting || mysteryBowling) {
    const isBatter = (mysteryStats?.runs || 0) > 500;
    
    if (isBatter && mysteryBatting) {
      radarData.push(
        { subject: 'Aggression', A: Math.min(100, (mysteryBatting.runs_per_ball * 100) / 1.8) },
        { subject: 'Consistency', A: Math.min(100, (mysteryStats?.runs || 0) / 50) },
        { subject: 'Finishing', A: Math.min(100, mysteryBatting.boundary_percentage * 3) },
        { subject: 'Longevity', A: Math.min(100, (mysteryStats?.matches || 0) / 2) },
        { subject: 'Anchoring', A: Math.min(100, mysteryBatting.dot_ball_percentage * 1.5) }
      );
    } else if (mysteryBowling) {
      radarData.push(
        { subject: 'Wicket Taker', A: Math.min(100, (mysteryStats?.wickets || 0) / 1.5) },
        { subject: 'Economy', A: 100 - Math.min(100, (mysteryBowling.economy || 8) * 8) },
        { subject: 'Strike Rate', A: 100 - Math.min(100, (mysteryBowling.bowling_strike_rate || 24) * 3) },
        { subject: 'Longevity', A: Math.min(100, (mysteryStats?.matches || 0) / 2) },
        { subject: 'Dot Pressure', A: Math.min(100, mysteryBowling.dot_ball_percentage * 1.5) }
      );
    }
  }

  if (loading && !mysteryStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <Gamepad2 className="h-16 w-16 text-primary animate-pulse" />
        <h2 className="text-2xl font-heading animate-pulse text-muted-foreground">Drafting Mystery Player...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mx-auto bg-card border border-border/50 rounded-3xl p-6 shadow-lg mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-display text-2xl sm:text-3xl m-0">Mystery Player</h1>
            <p className="text-body text-muted-foreground text-sm font-medium m-0">Build your streak by guessing the player.</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 sm:mt-0 bg-muted/30 py-3 px-6 rounded-2xl border border-border/50">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Streak</span>
            <span className="text-3xl font-display text-primary leading-none">{streak}</span>
          </div>
          <div className="w-px h-10 bg-border/50" />
          <div className="flex flex-col items-center opacity-70">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Best</span>
            <span className="text-3xl font-display text-foreground leading-none">{bestStreak}</span>
          </div>
        </div>
      </div>
          {/* Search Box */}
          <div className="w-full max-w-4xl mx-auto space-y-4">
            <div className="relative z-50 w-full" ref={dropdownRef}>
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground group-focus-within:text-[#0B2A98] transition-colors" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  disabled={isRevealed || isGuessing}
                  placeholder={isRevealed ? "Round Over!" : isGuessing ? "Fetching stats..." : "Enter player name..."} 
                  className={`w-full pl-12 pr-4 h-20 sm:h-24 text-2xl sm:text-3xl font-display placeholder:text-xl sm:placeholder:text-2xl border-4 bg-card border-2 border-border/50 rounded-xl text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#0B2A98] focus:ring-4 focus:ring-[#0B2A98]/20 transition-all shadow-sm ${(isRevealed || isGuessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {showDropdown && searchResults.length > 0 && !isRevealed && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-2xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-96 overflow-y-auto p-2">
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(res.name);
                          setShowDropdown(false);
                          handleGuess(res);
                        }}
                        className="w-full text-left p-3 hover:bg-muted/50 rounded-lg flex items-center justify-between transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-background overflow-hidden border border-border/50 shrink-0">
                            <img
                              src={res.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.name)}&background=random&color=fff&size=128`}
                              alt={res.name}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/players/default.png';
                              }}
                            />
                          </div>
                          <p className="font-semibold outfit-bold group-hover:text-[#0B2A98] transition-colors">{res.name}</p>
                        </div>
                        <div className="bg-[#0B2A98]/10 text-[#0B2A98] px-3 py-1 rounded-full text-xs font-bold">Select</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        
        {/* LEFT COLUMN: Mystery Card & Guessing Area */}
        <div className="w-full xl:w-[420px] flex-shrink-0 flex flex-col items-center space-y-6 xl:sticky xl:top-24">
          <div className="relative group w-full flex justify-center">
            <div className={`h-[300px] w-[300px] sm:h-[360px] sm:w-[360px] rounded-3xl overflow-hidden border-4 shadow-2xl transition-all duration-700 ${isRevealed ? (wrongGuesses >= 3 ? 'border-destructive/50' : 'border-primary shadow-primary/20') : 'border-[#0B2A96]/20 bg-slate-50'}`}>
              {isRevealed && mysteryImage ? (
                <img src={mysteryImage} alt="Revealed" className="h-full w-full object-cover animate-in fade-in zoom-in duration-500" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#0B2A96]/5 to-[#0B2A96]/15 relative">
                  {radarData.length > 0 ? (
                    <div className="absolute inset-0 opacity-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                          <PolarGrid gridType="polygon" stroke="rgba(11, 42, 150, 0.15)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#0B2A96', fontSize: 10, fontWeight: 'bold' }} />
                          <Radar name="Player" dataKey="A" stroke="#0B2A96" fill="#0B2A96" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                  <span className="text-[120px] font-black text-[#0B2A96]/10 z-10 select-none">?</span>
                </div>
              )}
            </div>
            
            {/* Health Bar / Tries */}
            {!isRevealed && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-card border border-border px-6 py-3 rounded-full shadow-lg">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-4 w-4 rounded-full transition-all duration-500 ${i < wrongGuesses ? 'bg-destructive/80 scale-90' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="text-center min-h-[60px] w-full flex flex-col justify-center mt-6">
            {isRevealed ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in">
                <h2 className={`text-display text-3xl sm:text-4xl ${wrongGuesses >= 3 ? 'text-destructive' : 'text-primary'}`}>{mysteryPlayer?.name}</h2>
                <div className="flex items-center justify-center gap-3 mt-2 text-sm text-muted-foreground font-medium">
                  <span className="bg-muted/50 px-3 py-1 rounded-full">{mysteryStats?.matches || 0} Matches</span>
                  {mysteryStats?.runs > 0 && <span className="bg-muted/50 px-3 py-1 rounded-full">{mysteryStats?.runs} Runs</span>}
                  {mysteryStats?.wickets > 0 && <span className="bg-muted/50 px-3 py-1 rounded-full">{mysteryStats?.wickets} Wickets</span>}
                </div>
                <p className="text-muted-foreground text-caption mt-4 font-bold">{wrongGuesses >= 3 ? "Better luck next time!" : `Found in ${wrongGuesses + 1} tries!`}</p>
              </div>
            ) : (
              <h2 className="text-heading text-xl sm:text-2xl text-muted-foreground/60 tracking-[0.3em]">ANALYZE THE DATA</h2>
            )}
          </div>
          
          {isRevealed && (
            <button 
              onClick={() => startNewRound()} 
              className={`flex items-center justify-center gap-2 w-full max-w-[320px] h-14 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95 ${wrongGuesses >= 3 ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}
            >
              <RotateCcw className="h-6 w-6" />
              {wrongGuesses >= 3 ? "Try Again (Streak Lost)" : "Next Player →"}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Premium Data Panels */}
        <div className="w-full xl:flex-1 space-y-6">
          
          {/* Phase 0: Base Stats & Profiles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Career Base Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-lg relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="h-24 w-24" />
              </div>
              <h3 className="font-heading text-xl mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Career Base
              </h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <PremiumStatBox label="Matches" value={mysteryStats?.matches || "-"} highlight />
                <PremiumStatBox label="Total Runs" value={mysteryStats?.runs || "-"} />
                <PremiumStatBox label="Total Wickets" value={mysteryStats?.wickets || "-"} />
                <PremiumStatBox label={(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? "Highest Score" : "Best Bowling"} value={(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? (mysteryStats?.highest_score || "-") : (mysteryStats?.best_bowling_figures || "-")} />
              </div>
            </div>

            {/* Batting/Bowling Profile Card */}
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-lg relative overflow-hidden group h-full">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="h-24 w-24" />
              </div>
              <h3 className="font-heading text-xl mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0B2A96]" />
                Deep Profile
              </h3>
              
              {(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <PremiumStatBox label="Strike Rate" value={mysteryBatting?.runs_per_ball ? (mysteryBatting.runs_per_ball * 100).toFixed(1) : "-"} highlight />
                  <PremiumStatBox label="Boundary %" value={mysteryBatting?.boundary_percentage ? `${mysteryBatting.boundary_percentage}%` : "-"} />
                  <PremiumStatBox label="Dot Ball %" value={mysteryBatting?.dot_ball_percentage ? `${mysteryBatting.dot_ball_percentage}%` : "-"} />
                  <PremiumStatBox label="Sixes" value={mysteryBatting?.sixes || mysteryMilestones?.sixes || "-"} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <PremiumStatBox label="Economy" value={mysteryBowling?.economy || "-"} highlight />
                  <PremiumStatBox label="Bowling SR" value={mysteryBowling?.bowling_strike_rate || "-"} />
                  <PremiumStatBox label="Bowling Avg" value={mysteryBowling?.bowling_average || "-"} />
                  <PremiumStatBox label="Dot Ball %" value={mysteryBowling?.dot_ball_percentage ? `${mysteryBowling.dot_ball_percentage}%` : "-"} />
                </div>
              )}
            </div>
          </div>

          {/* Guess History Table (Only show if there are guesses) */}
          {guessHistory.length > 0 && (
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-heading text-xl mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-[#0B2A98]" />
                Guess Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-muted-foreground uppercase bg-muted/50 tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-bold rounded-tl-lg">Guessed Player</th>
                      <th className="px-4 py-3 font-bold text-center">Matches</th>
                      <th className="px-4 py-3 font-bold text-center">Runs</th>
                      <th className="px-4 py-3 font-bold text-center">Wickets</th>
                      <th className="px-4 py-3 font-bold text-center rounded-tr-lg">Centuries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guessHistory.map((guess, idx) => {
                      const actualMatches = mysteryStats?.matches || 0;
                      const actualRuns = mysteryStats?.runs || 0;
                      const actualWickets = mysteryStats?.wickets || 0;
                      const actualCenturies = mysteryStats?.hundreds || mysteryMilestones?.centuries || 0;

                      const getDiffIcon = (guessed: number, actual: number) => {
                        if (guessed === actual) return <span className="text-green-500 font-bold bg-green-500/10 px-2 rounded-full py-0.5 inline-flex">✓ EXACT</span>;
                        if (guessed < actual) return <span className="text-[#0B2A98] font-bold flex items-center justify-center gap-0.5 bg-[#0B2A98]/10 px-2 rounded-full py-0.5"><ArrowRight className="h-3 w-3 -rotate-45" /> HIGHER</span>;
                        return <span className="text-red-400 font-bold flex items-center justify-center gap-0.5 bg-red-400/10 px-2 rounded-full py-0.5"><ArrowRight className="h-3 w-3 pl-[1px] pt-[1px] rotate-45" /> LOWER</span>;
                      };

                      return (
                        <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-4 font-bold text-foreground">
                            <span className={`flex items-center gap-2 ${guess.isCorrect ? "text-green-500" : "text-destructive"}`}>
                              {guess.isCorrect ? "✅ " : "❌ "}
                              {guess.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center bg-background/50 border-x border-border/10">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-display">{guess.matches}</span>
                              <span className="text-[10px]">{getDiffIcon(guess.matches, actualMatches)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-display">{guess.runs}</span>
                              <span className="text-[10px]">{getDiffIcon(guess.runs, actualRuns)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center bg-background/50 border-x border-border/10">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-display">{guess.wickets}</span>
                              <span className="text-[10px]">{getDiffIcon(guess.wickets, actualWickets)}</span>
                            </div>
                          </td>
                           <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg font-display">{guess.centuries}</span>
                              <span className="text-[10px]">{getDiffIcon(guess.centuries, actualCenturies)}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Career Milestones */}
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 h-full">
                <h3 className="font-heading text-xl mb-6 flex items-center gap-2 text-[#0B2A98]">
                  <Award className="h-5 w-5" />
                  Career Milestones
                </h3>
                
                <div className="space-y-2">
                  {(mysteryStats?.hundreds > 0 || mysteryStats?.fifties > 0 || mysteryStats?.highest_score || mysteryStats?.five_w > 0 || mysteryStats?.four_w > 0 || mysteryMilestones?.orange_caps || mysteryMilestones?.purple_caps) ? (
                    <>
                      {/* Batting Milestones */}
                      {(mysteryStats?.hundreds || mysteryMilestones?.centuries) > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">🏏 Hundreds</span>
                          <span className="font-display text-xl">{mysteryStats?.hundreds || mysteryMilestones?.centuries}</span>
                        </div>
                      )}
                      {(mysteryStats?.fifties || mysteryMilestones?.fifties) > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">🔥 50+ Scores</span>
                          <span className="font-display text-xl">{mysteryStats?.fifties || mysteryMilestones?.fifties}</span>
                        </div>
                      )}
                      {(mysteryStats?.highest_score || mysteryMilestones?.highest_score) && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">⭐ Highest Score</span>
                          <span className="font-display text-xl">{mysteryStats?.highest_score || mysteryMilestones?.highest_score}</span>
                        </div>
                      )}

                      {/* Bowling Milestones */}
                      {mysteryStats?.five_w > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">🎯 5-Wicket Hauls</span>
                          <span className="font-display text-xl">{mysteryStats.five_w}</span>
                        </div>
                      )}
                      {mysteryStats?.four_w > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">🎯 4-Wicket Hauls</span>
                          <span className="font-display text-xl">{mysteryStats.four_w}</span>
                        </div>
                      )}
                      {mysteryStats?.best_bowling_figures && mysteryStats?.wickets > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40">
                          <span className="font-medium text-muted-foreground">✨ Best Bowling</span>
                          <span className="font-display text-xl">{mysteryStats.best_bowling_figures}</span>
                        </div>
                      )}

                      {/* Caps (from milestones.json only since API lacks this) */}
                      {mysteryMilestones?.orange_caps !== undefined && mysteryMilestones.orange_caps > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40 bg-[#0B2A98]/5 px-2 -mx-2 rounded-md">
                          <span className="font-bold text-[#0B2A98]">🟠 Orange Caps</span>
                          <span className="font-display text-xl text-[#0B2A98]">{mysteryMilestones.orange_caps}</span>
                        </div>
                      )}
                      {mysteryMilestones?.purple_caps !== undefined && mysteryMilestones.purple_caps > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-border/40 bg-[#0B2A98]/5 px-2 -mx-2 rounded-md">
                          <span className="font-bold text-[#0B2A98]">🟣 Purple Caps</span>
                          <span className="font-display text-xl text-[#0B2A98]">{mysteryMilestones.purple_caps}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4 bg-muted/20 rounded-xl">No milestones available.</p>
                  )}
                </div>
              </div>
              
              {/* Tavily & Groq AI Hints */}
              <div className={`col-span-1 lg:col-span-3 bg-card border rounded-3xl p-6 sm:p-8 shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 ${
                wrongGuesses >= 3 || isRevealed 
                  ? 'border-[#0B2A98]/30 shadow-[#0B2A98]/5' 
                  : 'border-border/50 opacity-70'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading text-xl flex items-center gap-2 text-[#0B2A98]">
                    <Sparkles className="h-5 w-5" />
                    AI Trivia Hints
                  </h3>
                  {(wrongGuesses < 1 && !isRevealed) && (
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Unlocks after 1st miss
                    </span>
                  )}
                </div>
                
                {wrongGuesses >= 1 || isRevealed ? (
                  loadingAiHints ? (
                    <div className="flex items-center justify-center gap-3 p-8 bg-background/50 rounded-2xl border border-dashed border-border/50">
                      <div className="w-5 h-5 border-2 border-[#0B2A98] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Tavily & Groq generating hints...</span>
                    </div>
                  ) : aiHints && aiHints.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aiHints.map((hint, i) => (
                        <div key={i} className="flex gap-3 items-start p-5 bg-[#0B2A98]/5 hover:bg-[#0B2A98]/10 transition-colors rounded-2xl border border-[#0B2A98]/20 text-sm sm:text-base text-foreground font-medium group">
                          <span className="text-[#0B2A98] font-black text-2xl opacity-50 group-hover:opacity-100 transition-opacity shrink-0 leading-none">0{i + 1}</span>
                          <span className="leading-snug pt-1 text-muted-foreground group-hover:text-foreground transition-colors">{hint}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-background/50 rounded-2xl border border-dashed border-border/50 text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">No trivia found for this player.</div>
                  )
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10">
                    <Lock className="w-8 h-8 text-muted-foreground/50" />
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Make 1 wrong guess to unlock</span>
                  </div>
                )}
              </div>


        </div>
      </div>
    </div>
  );
}

function PremiumStatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 ${highlight ? 'bg-primary text-primary-foreground border-primary shadow-[0_4px_20px_rgba(var(--primary),0.3)]' : 'bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-muted/50'}`}>
      <p className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold mb-2 truncate ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{label}</p>
      <p className="text-2xl sm:text-3xl font-display">{value}</p>
    </div>
  );
}
