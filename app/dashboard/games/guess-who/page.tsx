"use client";

import { useState, useEffect, useRef } from "react";
import { Gamepad2, Search, ArrowRight, RotateCcw, Shield, Swords, Info, Target, TrendingUp, Zap, Star, Award, ChevronDown, Activity, Sparkles, Lock, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { getBattingLeaders, getPlayerCareer, getAdvancedBatting, getAdvancedBowling, fetchPlayerImage, getPlayerTopPartnership } from "@/app/actions/analytics";
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
  const [mysteryPartnership, setMysteryPartnership] = useState<any | null>(null);
  const [mysteryImage, setMysteryImage] = useState<string | null>(null);
  const [mysteryTeamsCount, setMysteryTeamsCount] = useState<number>(0);
  
  const [isRevealed, setIsRevealed] = useState(false);
  const [wrongGuesses, setWrongGuesses] = useState<number>(0);
  const [guessHistory, setGuessHistory] = useState<GuessRecord[]>([]);
  const [isGuessing, setIsGuessing] = useState(false);

  // Progressive Reveal State
  const [aiHints, setAiHints] = useState<string[] | null>(null);
  const [loadingAiHints, setLoadingAiHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState<boolean[]>([false, false, false]);
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
        poolPlayers = players.map((p: any) => ({ id: p.cricsheet_name || p.name, name: p.name }));
      }

      setPlayerPool(poolPlayers);
      startNewRound(poolPlayers);
    }
    initGame();
  }, []);

  // Fetch AI Hints & Partnerships immediately when the mystery player and stats are finished loading
  useEffect(() => {
    if (!loading && mysteryPlayer && mysteryPlayer.name) {
      setLoadingAiHints(true);
      setAiHints(null);
      
      const dbStats: any = {};
      if (mysteryStats) {
        dbStats.career = {
          matches: mysteryStats.matches,
          runs: mysteryStats.runs,
          wickets: mysteryStats.wickets
        };
      }
      if (mysteryBatting) {
        dbStats.batting = {
          strike_rate: mysteryBatting.strike_rate,
          average: mysteryBatting.average,
          highest_score: mysteryBatting.highest_score,
          hundreds: mysteryBatting.hundreds,
          fifties: mysteryBatting.fifties
        };
      }
      if (mysteryBowling) {
        dbStats.bowling = {
          economy: mysteryBowling.economy,
          bowling_strike_rate: mysteryBowling.bowling_strike_rate,
          bowling_average: mysteryBowling.bowling_average,
          wickets: mysteryBowling.wickets
        };
      }
      if (mysteryMilestones) {
        dbStats.milestones = {
          orange_caps: mysteryMilestones.orange_caps,
          purple_caps: mysteryMilestones.purple_caps,
          teams_played_for: mysteryMilestones.teams_played_for
        };
      }

      // Fetch AI hints in background
      getPlayerAIHints(mysteryPlayer.name, dbStats).then(res => {
        setAiHints(res.success && res.hints ? res.hints : []);
        setLoadingAiHints(false);
      }).catch(err => {
        console.error("AI hints fetch error:", err);
        setLoadingAiHints(false);
      });

      // Fetch Top Partnership in background
      getPlayerTopPartnership(mysteryPlayer.id).then(res => {
        if (res.success && res.data) {
          setMysteryPartnership(res.data);
        } else {
          setMysteryPartnership(null);
        }
      }).catch(err => {
        console.error("Partnership fetch error:", err);
        setMysteryPartnership(null);
      });
    }
  }, [loading, mysteryPlayer]);

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
    setRevealedHints([false, false, false]);
    setMysteryPartnership(null);

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

  const maskPartnerName = (name: string) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.map((part, idx) => {
      if (idx === 0) {
        return part.charAt(0) + ".";
      }
      if (part.length <= 2) return part;
      return part.substring(0, 1) + "*".repeat(part.length - 1);
    }).join(" ");
  };

  const revealClue = (index: number) => {
    setRevealedHints(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const handleRegenerateHints = async () => {
    if (!mysteryPlayer || loadingAiHints) return;
    setLoadingAiHints(true);
    
    const dbStats: any = {};
    if (mysteryStats) {
      dbStats.career = {
        matches: mysteryStats.matches,
        runs: mysteryStats.runs,
        wickets: mysteryStats.wickets
      };
    }
    if (mysteryBatting) {
      dbStats.batting = {
        strike_rate: mysteryBatting.strike_rate,
        average: mysteryBatting.average,
        highest_score: mysteryBatting.highest_score,
        hundreds: mysteryBatting.hundreds,
        fifties: mysteryBatting.fifties
      };
    }
    if (mysteryBowling) {
      dbStats.bowling = {
        economy: mysteryBowling.economy,
        bowling_strike_rate: mysteryBowling.bowling_strike_rate,
        bowling_average: mysteryBowling.bowling_average,
        wickets: mysteryBowling.wickets
      };
    }
    if (mysteryMilestones) {
      dbStats.milestones = {
        orange_caps: mysteryMilestones.orange_caps,
        purple_caps: mysteryMilestones.purple_caps,
        teams_played_for: mysteryMilestones.teams_played_for
      };
    }

    try {
      const res = await getPlayerAIHints(mysteryPlayer.name, dbStats);
      if (res.success && res.hints) {
        setAiHints(res.hints);
      }
    } catch (err) {
      console.error("Failed to regenerate hints:", err);
    } finally {
      setLoadingAiHints(false);
    }
  };

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
      setRevealedHints([true, true, true]);
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
      const nextWrong = wrongGuesses + 1;
      setWrongGuesses(nextWrong);
      
      setRevealedHints(prev => {
        const next = [...prev];
        if (nextWrong >= 1) next[0] = true;
        if (nextWrong >= 2) next[1] = true;
        if (nextWrong >= 3) next[2] = true;
        return next;
      });
      
      if (wrongGuesses >= 2) {
        setIsRevealed(true);
        setRevealedHints([true, true, true]);
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
        <Gamepad2 className="h-16 w-16 text-[#0B2A96] animate-pulse" />
        <h2 className="text-2xl font-black animate-pulse text-slate-400 outfit-bold uppercase tracking-widest">Drafting Mystery Player...</h2>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full font-sans bg-slate-50">
      
      {/* Sleek Blue Lobby Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-6xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-xs mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-[#0B2A96]/10 p-3 rounded-2xl">
            <Target className="h-8 w-8 text-[#0B2A96]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 m-0 outfit-bold uppercase tracking-tight">Mystery Player</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">Build your streak by guessing the player.</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4 sm:mt-0 bg-slate-50 py-3 px-6 rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Streak</span>
            <span className="text-3xl font-black text-[#0B2A96] leading-none outfit-bold">{streak}</span>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex flex-col items-center opacity-70">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Best</span>
            <span className="text-3xl font-black text-slate-700 leading-none outfit-bold">{bestStreak}</span>
          </div>
        </div>
      </div>

      {/* Sleek Normal Sized Search Box */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <div className="relative z-50 w-full" ref={dropdownRef}>
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#0B2A96] transition-colors" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
              disabled={isRevealed || isGuessing}
              placeholder={isRevealed ? "Round Over!" : isGuessing ? "Fetching stats..." : "Enter player name..."} 
              className={`w-full pl-12 pr-4 h-14 sm:h-16 text-base sm:text-lg border-2 bg-white border-slate-200 rounded-xl text-slate-800 placeholder:text-sm sm:placeholder:text-base font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#0B2A96] focus:ring-4 focus:ring-[#0B2A96]/10 transition-all shadow-xs ${(isRevealed || isGuessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
          {showDropdown && searchResults.length > 0 && !isRevealed && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="max-h-96 overflow-y-auto p-2">
                {searchResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(res.name);
                      setShowDropdown(false);
                      handleGuess(res);
                    }}
                    className="w-full text-left p-3 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Scaled Down Search Avatar */}
                      <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                        <img
                          src={res.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.name)}&background=random&color=fff&size=128`}
                          alt={res.name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/players/default.png';
                          }}
                        />
                      </div>
                      <p className="font-semibold outfit-bold text-slate-700 group-hover:text-[#0B2A96] transition-colors text-sm sm:text-base">{res.name}</p>
                    </div>
                    <div className="bg-[#0B2A96]/10 text-[#0B2A96] px-3 py-1 rounded-full text-xs font-bold">Select</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        
        {/* LEFT COLUMN: Mystery Card & Guessing Area */}
        <div className="w-full xl:w-[300px] flex-shrink-0 flex flex-col items-center space-y-6 xl:sticky xl:top-24">
          <div className="relative group w-full flex justify-center">
            {/* Shrunk Mystery Card */}
            <div className={`h-[260px] w-[260px] sm:h-[280px] sm:w-[280px] rounded-3xl overflow-hidden border-4 shadow-2xl transition-all duration-700 bg-white ${isRevealed ? (wrongGuesses >= 3 ? 'border-red-500/80 shadow-red-100' : 'border-emerald-500/80 shadow-emerald-100') : 'border-[#0B2A96]/20'}`}>
              {isRevealed && mysteryImage ? (
                <img src={mysteryImage} alt="Revealed" className="h-full w-full object-cover animate-in fade-in zoom-in duration-500" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#0B2A96]/5 to-[#0B2A96]/15 relative">
                  {radarData.length > 0 ? (
                    <div className="absolute inset-0 opacity-85">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="55%" data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                          <PolarGrid gridType="polygon" stroke="rgba(11, 42, 150, 0.15)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#0B2A96', fontSize: 10, fontWeight: 'bold' }} />
                          <Radar name="Player" dataKey="A" stroke="#0B2A96" fill="#0B2A96" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : null}
                  <span className="text-[100px] font-black text-[#0B2A96]/10 z-10 select-none">?</span>
                </div>
              )}
            </div>
            
            {/* Health Bar / Tries */}
            {!isRevealed && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-white border border-slate-200 px-6 py-3 rounded-full shadow-md z-30">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`h-4 w-4 rounded-full transition-all duration-500 ${i < wrongGuesses ? 'bg-red-500 scale-90' : 'bg-[#0B2A96] shadow-[0_0_10px_rgba(11,42,150,0.5)]'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="text-center min-h-[60px] w-full flex flex-col justify-center mt-6">
            {isRevealed ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in">
                <h2 className="text-2xl sm:text-3xl font-black outfit-bold text-slate-800">{mysteryPlayer?.name}</h2>
                <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-500 font-bold">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.matches || 0} Matches</span>
                  {mysteryStats?.runs > 0 && <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.runs} Runs</span>}
                  {mysteryStats?.wickets > 0 && <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.wickets} Wickets</span>}
                </div>
                <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-wider">{wrongGuesses >= 3 ? "Better luck next time!" : `Found in ${wrongGuesses + 1} tries!`}</p>
              </div>
            ) : (
              <h2 className="text-sm text-slate-400 font-extrabold tracking-[0.2em] uppercase">ANALYZE THE DATA</h2>
            )}
          </div>
          
          {isRevealed && (
            <button 
              onClick={() => startNewRound()} 
              className={`flex items-center justify-center gap-2 w-full max-w-[320px] h-14 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-md active:scale-95 cursor-pointer text-white ${wrongGuesses >= 3 ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0B2A96] hover:bg-blue-800'}`}
            >
              <RotateCcw className="h-4 w-4" />
              {wrongGuesses >= 3 ? "Try Again" : "Next Player →"}
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: Wider Premium Data Panels */}
        <div className="w-full xl:flex-1 space-y-6">
          
          {/* Phase 0: Enrich Stats Grids (🏏 Batting and 🎳 Bowling Career Summary) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Batting Career Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-5 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Target className="h-20 w-20 text-slate-800" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wider">
                <Activity className="h-4.5 w-4.5 text-[#0B2A96]" />
                Batting Career
              </h3>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <PremiumStatBox label="Matches" value={mysteryStats?.matches || "-"} highlight />
                <PremiumStatBox label="Innings" value={mysteryStats?.innings_batted || "-"} />
                <PremiumStatBox label="Runs" value={mysteryStats?.runs || "-"} />
                <PremiumStatBox label="Avg" value={mysteryStats?.batting_average || "-"} />
                <PremiumStatBox label="Strike Rate" value={mysteryStats?.batting_strike_rate || "-"} />
                <PremiumStatBox label="Highest" value={mysteryStats?.highest_score || "-"} />
              </div>
            </div>

            {/* Bowling Career Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-5 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Zap className="h-20 w-20 text-slate-800" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wider">
                <TrendingUp className="h-4.5 w-4.5 text-[#0B2A96]" />
                Bowling Career
              </h3>
              <div className="grid grid-cols-3 gap-3 relative z-10">
                <PremiumStatBox label="Wickets" value={mysteryStats?.wickets || "-"} highlight />
                <PremiumStatBox label="Innings" value={mysteryStats?.innings_bowled || "-"} />
                <PremiumStatBox label="Economy" value={mysteryStats?.economy || "-"} />
                <PremiumStatBox label="Avg" value={mysteryStats?.bowling_average || "-"} />
                <PremiumStatBox label="Strike Rate" value={mysteryStats?.bowling_strike_rate || "-"} />
                <PremiumStatBox label="Best Bowling" value={mysteryStats?.best_bowling_figures || "-"} />
              </div>
            </div>

          </div>

          {/* Top Partnership Card (Gameplay clue) */}
          {mysteryPartnership && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4">
              <div className="absolute top-0 right-0 p-5 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <Users className="h-20 w-20 text-slate-800" />
              </div>
              <h3 className="text-sm font-black text-slate-850 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wider">
                <Users className="h-4.5 w-4.5 text-[#0B2A96]" />
                Top Franchise Partnership
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                <PremiumStatBox 
                  label="Partner" 
                  value={isRevealed ? mysteryPartnership.partner_name : maskPartnerName(mysteryPartnership.partner_name)} 
                  highlight 
                />
                <PremiumStatBox label="Partnership Runs" value={mysteryPartnership.runs || "-"} />
                <PremiumStatBox label="Highest Stand" value={mysteryPartnership.highest || "-"} />
                <PremiumStatBox label="Avg Partnership" value={mysteryPartnership.avg || "-"} />
              </div>
            </div>
          )}

          {/* Combined Advanced Metrics (Deep Profile) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-5 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <TrendingUp className="h-20 w-20 text-slate-800" />
            </div>
            <h3 className="text-sm font-black text-slate-850 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wider">
              <TrendingUp className="h-4.5 w-4.5 text-[#0B2A96]" />
              Advanced Metrics (Deep Profile)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              <PremiumStatBox label="Batting Dot %" value={mysteryBatting?.dot_ball_percentage ? `${mysteryBatting.dot_ball_percentage}%` : "-"} />
              <PremiumStatBox label="Boundary %" value={mysteryBatting?.boundary_percentage ? `${mysteryBatting.boundary_percentage}%` : "-"} />
              <PremiumStatBox label="Bowling Dot %" value={mysteryBowling?.dot_ball_percentage ? `${mysteryBowling.dot_ball_percentage}%` : "-"} />
              <PremiumStatBox label="Bowling Econ" value={mysteryBowling?.economy || "-"} />
            </div>
          </div>

          {/* Guess History Table (Only show if there are guesses) */}
          {guessHistory.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wide">
                <Search className="h-5 w-5 text-[#0B2A96]" />
                Guess Analysis
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-bold rounded-l-lg">Guessed Player</th>
                      <th className="px-4 py-3 font-bold text-center">Matches</th>
                      <th className="px-4 py-3 font-bold text-center">Runs</th>
                      <th className="px-4 py-3 font-bold text-center">Wickets</th>
                      <th className="px-4 py-3 font-bold text-center rounded-r-lg">Centuries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guessHistory.map((guess, idx) => {
                      const actualMatches = mysteryStats?.matches || 0;
                      const actualRuns = mysteryStats?.runs || 0;
                      const actualWickets = mysteryStats?.wickets || 0;
                      const actualCenturies = mysteryStats?.hundreds || mysteryMilestones?.centuries || 0;

                      const getDiffIcon = (guessed: number, actual: number) => {
                        if (guessed === actual) return <span className="text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-250 px-2 rounded-full py-0.5 inline-flex text-[9px]">✓ EXACT</span>;
                        if (guessed < actual) return <span className="text-[#0B2A96] font-extrabold flex items-center justify-center gap-0.5 bg-[#0B2A96]/5 border border-[#0B2A96]/10 px-2 rounded-full py-0.5 text-[9px]"><ArrowRight className="h-2.5 w-2.5 -rotate-45" /> HIGHER</span>;
                        return <span className="text-rose-600 font-extrabold flex items-center justify-center gap-0.5 bg-rose-50 border border-rose-150 px-2 rounded-full py-0.5 text-[9px]"><ArrowRight className="h-2.5 w-2.5 pl-[1px] pt-[1px] rotate-45" /> LOWER</span>;
                      };

                      return (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-800 text-sm">
                            <span className={`flex items-center gap-2 ${guess.isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                              {guess.isCorrect ? "✅ " : "❌ "}
                              {guess.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center bg-slate-50/30 border-x border-slate-100">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-black text-slate-700 outfit-bold">{guess.matches}</span>
                              <span>{getDiffIcon(guess.matches, actualMatches)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-black text-slate-700 outfit-bold">{guess.runs}</span>
                              <span>{getDiffIcon(guess.runs, actualRuns)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center bg-slate-50/30 border-x border-slate-100">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-black text-slate-700 outfit-bold">{guess.wickets}</span>
                              <span>{getDiffIcon(guess.wickets, actualWickets)}</span>
                            </div>
                          </td>
                           <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-black text-slate-700 outfit-bold">{guess.centuries}</span>
                              <span>{getDiffIcon(guess.centuries, actualCenturies)}</span>
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
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 h-full">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 outfit-bold uppercase tracking-wide">
              <Award className="h-5 w-5 text-[#0B2A96]" />
              Career Milestones
            </h3>
            
            <div className="space-y-2">
              {(mysteryStats?.hundreds > 0 || mysteryStats?.fifties > 0 || mysteryStats?.highest_score || mysteryStats?.five_w > 0 || mysteryStats?.four_w > 0 || mysteryMilestones?.orange_caps || mysteryMilestones?.purple_caps) ? (
                <>
                  {/* Batting Milestones */}
                  {(mysteryStats?.hundreds || mysteryMilestones?.centuries) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">🏏 Hundreds</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats?.hundreds || mysteryMilestones?.centuries}</span>
                    </div>
                  )}
                  {(mysteryStats?.fifties || mysteryMilestones?.fifties) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">🔥 50+ Scores</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats?.fifties || mysteryMilestones?.fifties}</span>
                    </div>
                  )}
                  {(mysteryStats?.highest_score || mysteryMilestones?.highest_score) && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">⭐ Highest Score</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats?.highest_score || mysteryMilestones?.highest_score}</span>
                    </div>
                  )}

                  {/* Bowling Milestones */}
                  {mysteryStats?.five_w > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">🎯 5-Wicket Hauls</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats.five_w}</span>
                    </div>
                  )}
                  {mysteryStats?.four_w > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">🎯 4-Wicket Hauls</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats.four_w}</span>
                    </div>
                  )}
                  {mysteryStats?.best_bowling_figures && mysteryStats?.wickets > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-semibold text-slate-500 text-sm">✨ Best Bowling</span>
                      <span className="font-black text-slate-800 text-base outfit-bold">{mysteryStats.best_bowling_figures}</span>
                    </div>
                  )}

                  {/* Caps */}
                  {mysteryMilestones?.orange_caps !== undefined && mysteryMilestones.orange_caps > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-orange-50 px-3 -mx-3 rounded-md">
                      <span className="font-bold text-orange-700 text-sm"> 🟠 Orange Caps</span>
                      <span className="font-black text-orange-700 text-base outfit-bold">{mysteryMilestones.orange_caps}</span>
                    </div>
                  )}
                  {mysteryMilestones?.purple_caps !== undefined && mysteryMilestones.purple_caps > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-purple-50 px-3 -mx-3 rounded-md">
                      <span className="font-bold text-purple-700 text-sm">🟣 Purple Caps</span>
                      <span className="font-black text-purple-700 text-base outfit-bold">{mysteryMilestones.purple_caps}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl font-medium text-xs">No milestones available.</p>
              )}
            </div>
          </div>
          
          {/* Tavily & Groq AI Hints */}
          <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#0B2A96]" />
                <h3 className="text-sm font-black text-slate-800 outfit-bold uppercase tracking-wide">
                  AI Trivia Hints
                </h3>
                <span className="text-[9px] font-bold text-[#0B2A96] bg-[#0B2A96]/5 border border-[#0B2A96]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Unlocked anytime
                </span>
              </div>
              {aiHints && aiHints.length > 0 && !isRevealed && (
                <button 
                  onClick={handleRegenerateHints}
                  disabled={loadingAiHints}
                  className="text-xs text-[#0B2A96] hover:text-blue-800 font-extrabold uppercase tracking-wider flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Get Different Hints
                </button>
              )}
            </div>
            
            {loadingAiHints ? (
              <div className="flex items-center justify-center gap-3 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-5 h-5 border-2 border-[#0B2A96] border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-bold text-slate-500 tracking-widest uppercase animate-pulse">Groq generating hints...</span>
              </div>
            ) : (!aiHints || aiHints.length === 0) ? (
              <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-250 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No trivia hints loaded.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                {aiHints.map((hint, i) => (
                  <div key={i} className="h-full">
                    {revealedHints[i] ? (
                      <div className="flex gap-3 items-start p-5 bg-[#0B2A98]/5 hover:bg-[#0B2A98]/10 transition-all duration-300 rounded-2xl border border-[#0B2A98]/20 text-sm text-slate-800 font-medium group relative overflow-hidden h-full min-h-[110px]">
                        <div className="absolute top-0 right-0 bg-[#0B2A96] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl">
                          {i === 0 ? "Hard" : i === 1 ? "Medium" : "Easy"}
                        </div>
                        <span className="text-[#0B2A96] font-black text-2xl opacity-50 group-hover:opacity-100 transition-opacity shrink-0 leading-none">0{i + 1}</span>
                        <span className="leading-snug pt-1 text-slate-600 group-hover:text-slate-800 transition-colors">{hint}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => revealClue(i)}
                        className="flex flex-col items-center justify-center p-5 bg-slate-50 hover:bg-slate-100/80 transition-all duration-300 rounded-2xl border border-dashed border-slate-300 text-slate-500 font-medium h-full min-h-[110px] w-full text-center group cursor-pointer hover:border-[#0B2A96]/40"
                      >
                        <Lock className="w-5 h-5 text-slate-400 group-hover:text-[#0B2A96] transition-colors mb-1.5" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#0B2A96] transition-colors">Reveal Clue {i + 1}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">{i === 0 ? "Hard" : i === 1 ? "Medium" : "Easy"} Clue</span>
                      </button>
                    )}
                  </div>
                ))}
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
    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 ${highlight ? 'bg-[#0B2A96] text-white border-[#0B2A96] shadow-lg' : 'bg-white border-slate-200/65 hover:border-[#0B2A96]/40 hover:bg-slate-50'}`}>
      <p className={`text-[10px] sm:text-xs uppercase tracking-widest font-extrabold mb-1.5 leading-tight ${highlight ? 'text-white/80' : 'text-slate-400'}`}>{label}</p>
      <p className={`text-lg sm:text-xl font-black ${highlight ? 'text-white' : 'text-slate-800'} outfit-bold truncate`}>{value}</p>
    </div>
  );
}
