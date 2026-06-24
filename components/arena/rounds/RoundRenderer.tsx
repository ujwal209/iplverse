"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, Lightbulb, Calendar, Loader2, MapPin, ArrowUp, ArrowDown, Activity, TrendingUp, Zap, Award, Sparkles, Lock, Target } from "lucide-react";
import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";
import { getPlayerCareer, getAdvancedBatting, getAdvancedBowling, fetchPlayerImage } from "@/app/actions/analytics";
import { getAllTeams, getAllSearchableMatches } from "@/app/actions/games";
import Fuse from "fuse.js";
import milestones from "@/lib/data/milestones.json";
import playerMappings from "@/lib/data/player-mappings.json";
import confetti from "canvas-confetti";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { GameHeader } from "@/components/game/game-header";

interface RoundProps {
  roundType: string;
  questionData: any;
  gameState: string;
  onAnswer: (answer: any) => void;
  disabled: boolean;
  myAnswer: any | null;
  correctAnswer?: any;
  explanation?: string;
}

export function RoundRenderer({ 
  roundType, 
  questionData, 
  gameState, 
  onAnswer, 
  disabled, 
  myAnswer,
  correctAnswer,
  explanation
}: RoundProps) {
  
  if (roundType === "WHO_AM_I" || roundType === "MYSTERY_PLAYER") {
    return <ArenaGuessWhoRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "MATCH_MEMORY") {
    return <ArenaMatchMemoryRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "PLAYER_VS_PLAYER") {
    return <PlayerVsPlayerRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "STAT_SMASH") {
    return <StatSmashRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "ARENA_QUIZ") {
    return <ArenaQuizRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "CONNECTIONS_RACE") {
    return <ConnectionsRaceRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  if (roundType === "CAREER_PATH_DUEL") {
    return <ArenaCareerPathRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
  }

  // Fallbacks for others
  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold outfit-bold text-primary mb-4">{roundType.replace(/_/g, " ")}</h3>
      <p className="text-muted-foreground mb-8">This round type is being built.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={() => onAnswer("A")} disabled={disabled} className="px-6 py-3 bg-card border border-border rounded-xl">Answer A</button>
        <button onClick={() => onAnswer("B")} disabled={disabled} className="px-6 py-3 bg-card border border-border rounded-xl">Answer B</button>
      </div>
    </div>
  );
}

function ArenaMatchMemoryRound({ roundType, questionData, onAnswer, disabled, myAnswer, correctAnswer, gameState }: RoundProps) {
  const [visibleClues, setVisibleClues] = useState<number>(1);
  const clues = questionData?.clues || [];
  const isReveal = gameState === "answer_reveal" || gameState === "scoreboard";

  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [teamsDb, setTeamsDb] = useState<any[]>([]);
  const fuseRef = useRef<Fuse<any> | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load matches for search
  useEffect(() => {
    async function loadMatches() {
      const res = await getAllSearchableMatches();
      if (res.success && res.matches) {
        const enriched = res.matches.map((m: any) => ({
          ...m,
          searchKey: `${m.season} ${m.team1} vs ${m.team2}`
        }));
        setAllMatches(enriched);
        fuseRef.current = new Fuse(enriched, {
          keys: ["searchKey", "team1", "team2", "season"],
          threshold: 0.4,
        });
      }
    }
    loadMatches();
  }, []);

  // Load teams list for logo lookup
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await getAllTeams();
        if (res.success && res.teams) {
          setTeamsDb(res.teams);
        }
      } catch (err) {
        console.error("Error loading teams for matchup logo:", err);
      }
    }
    loadTeams();
  }, []);

  // Reveal clues progressively
  useEffect(() => {
    if (visibleClues >= 4 || isReveal) return;
    const timer = setTimeout(() => {
      setVisibleClues(prev => Math.min(prev + 1, 4));
    }, 4000); 
    return () => clearTimeout(timer);
  }, [visibleClues, isReveal]);

  // Handle Search
  useEffect(() => {
    if (!isReveal && fuseRef.current) {
      if (query.trim().length > 0) {
        const results = fuseRef.current.search(query).slice(0, 20).map(res => res.item);
        setSearchResults(results);
      } else {
        setSearchResults(allMatches.slice(0, 20));
      }
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [query, isReveal, allMatches]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <GameHeader 
        title="Guess the Match"
        subtitle="Identify the IPL match based on the unfolding clues."
        backHref="/dashboard/arena"
        className="w-full max-w-5xl mb-4"
      />

      {!isReveal ? (
        // GUESSING PHASE
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-start mt-2">
          
          {/* Clues Section */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <h2 className="text-2xl font-black outfit-bold text-[#0B2A96] mb-2 uppercase tracking-wider">
              Mystery Match
            </h2>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Lightbulb className="h-5 w-5 text-[#0B2A96]" />
                <h3 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider">Unfolding Clues</h3>
              </div>

              <div className="space-y-3 min-h-[250px]">
                {clues.map((clue: string, idx: number) => {
                  const isUnlocked = visibleClues > idx;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 border rounded-2xl text-xs flex items-center justify-between transition-all duration-300 ${
                        isUnlocked 
                          ? "bg-blue-50/20 border-blue-100 text-slate-700 font-medium" 
                          : "bg-slate-50/50 border-slate-100/50 text-slate-400 animate-pulse"
                      }`}
                    >
                      {isUnlocked ? (
                        <div className="flex gap-2">
                          <span className="font-extrabold text-[#0B2A96]">Clue {idx + 1}:</span>
                          <span>{clue}</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <span className="font-bold opacity-50">Clue {idx + 1}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest opacity-40 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Unlocking...
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <h2 className="text-2xl font-black outfit-bold text-slate-800 mb-2 uppercase tracking-wider">
              Your Guess
            </h2>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <div className="relative" ref={dropdownRef}>
                <input 
                  type="text" 
                  value={myAnswer ? myAnswer : query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (!disabled && !myAnswer) setShowDropdown(true); }}
                  placeholder="Search for a match (e.g., 2011 MI vs CSK)..."
                  disabled={disabled || !!myAnswer}
                  className="w-full h-14 bg-slate-50 border-2 border-slate-200 rounded-xl px-6 text-sm font-bold focus:border-[#0B2A96] focus:bg-white focus:outline-none disabled:opacity-50 transition-all text-slate-800 placeholder:text-slate-400"
                />
                
                <AnimatePresence>
                  {showDropdown && searchResults.length > 0 && !disabled && !myAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                    >
                      {searchResults.map((match: any) => (
                        <button
                          key={match.id}
                          onClick={() => {
                            setQuery(match.searchKey);
                            setShowDropdown(false);
                            onAnswer(match.searchKey);
                          }}
                          className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        >
                          <span className="font-bold text-slate-700 text-sm">{match.searchKey}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {myAnswer && (
                <div className="mt-4 p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#0B2A96] flex items-center justify-center text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Locked In</p>
                    <p className="font-bold text-slate-800 text-sm">{myAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // REVEAL PHASE
        <div className="w-full max-w-2xl bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 sm:p-10 shadow-lg flex flex-col items-center text-center mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A96]/5 to-transparent pointer-events-none" />
          
          {/* Logo Matchup */}
          {(() => {
            const answerStr = questionData?.answer || correctAnswer || "";
            const parts = answerStr.split(" vs ");
            const team1Name = parts[0]?.trim();
            const team2Name = parts[1]?.trim();
            
            const team1Data = teamsDb.find(t => t.name.toLowerCase() === team1Name?.toLowerCase() || t.short_name.toLowerCase() === team1Name?.toLowerCase());
            const team2Data = teamsDb.find(t => t.name.toLowerCase() === team2Name?.toLowerCase() || t.short_name.toLowerCase() === team2Name?.toLowerCase());
            
            return (
              <div className="flex items-center justify-center gap-6 sm:gap-8 mb-6 relative z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-sm transition-all duration-300 hover:scale-105">
                    {team1Data?.image_url ? (
                      <img src={team1Data.image_url} alt={team1Name} className="object-contain h-full w-full" />
                    ) : (
                      <span className="text-xl font-black text-slate-400">{team1Data?.short_name || team1Name?.substring(0, 3)}</span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-slate-500 max-w-[120px] truncate uppercase tracking-wider">{team1Data?.short_name || team1Name}</span>
                </div>
                
                <div className="text-3xl font-black text-[#0B2A96]/20 select-none italic font-display">VS</div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="h-20 w-20 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center overflow-hidden p-2 shadow-sm transition-all duration-300 hover:scale-105">
                    {team2Data?.image_url ? (
                      <img src={team2Data.image_url} alt={team2Name} className="object-contain h-full w-full" />
                    ) : (
                      <span className="text-xl font-black text-slate-400">{team2Data?.short_name || team2Name?.substring(0, 3)}</span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-slate-500 max-w-[120px] truncate uppercase tracking-wider">{team2Data?.short_name || team2Name}</span>
                </div>
              </div>
            );
          })()}
          
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 relative z-10">The Match Was</h3>
          <h2 className="text-2xl sm:text-3xl font-black outfit-bold text-slate-800 mb-6 relative z-10">{questionData?.answer || correctAnswer}</h2>
          
          <div className="w-full bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-4">
            {clues.map((clue: string, idx: number) => (
              <div key={idx} className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-slate-700">{clue}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Guess</h4>
            {myAnswer ? (
              <div className={`text-xl font-black ${myAnswer === (questionData?.answer || correctAnswer) ? 'text-green-500' : 'text-red-500'}`}>
                {myAnswer}
              </div>
            ) : (
              <div className="text-xl font-black text-slate-400">Did not answer</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerVsPlayerRound({ questionData, onAnswer, disabled, myAnswer }: RoundProps) {
  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-4 fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold outfit-bold text-muted-foreground">{questionData.question}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border-2 border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg min-h-[250px]">
          <h3 className="text-3xl font-bold outfit-bold text-center mb-6">{questionData.optionA}</h3>
          <button 
            onClick={() => onAnswer("A")}
            disabled={disabled}
            className={`w-full h-14 font-bold rounded-xl transition-all ${
              myAnswer === "A" ? "bg-primary text-primary-foreground scale-105 shadow-lg" : "bg-muted hover:bg-primary/20 disabled:opacity-50"
            }`}
          >
            Select Option A
          </button>
        </div>

        <div className="bg-card border-2 border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg min-h-[250px]">
          <h3 className="text-3xl font-bold outfit-bold text-center mb-6">{questionData.optionB}</h3>
          <button 
            onClick={() => onAnswer("B")}
            disabled={disabled}
            className={`w-full h-14 font-bold rounded-xl transition-all ${
              myAnswer === "B" ? "bg-secondary text-secondary-foreground scale-105 shadow-lg" : "bg-muted hover:bg-secondary/20 disabled:opacity-50"
            }`}
          >
            Select Option B
          </button>
        </div>
      </div>
    </div>
  );
}

function StatSmashRound({ questionData, onAnswer, disabled, myAnswer, gameState }: RoundProps) {
  const isReveal = gameState === "answer_reveal" || gameState === "scoreboard";
  const p1Guessed = myAnswer === "HIGHER" || myAnswer === "LOWER"; 
  const q = questionData;

  return (
    <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 fade-in">
      <GameHeader 
        title="Stat Smash"
        subtitle={
          <span className="text-slate-600 text-sm">
            Which player has a higher <span className="font-black text-[#0B2A96] uppercase tracking-wider">{q.stat_display}</span>?
          </span>
        }
        backHref="/dashboard/arena"
        className="mb-4"
      />
      
      <div className={`flex flex-col lg:flex-row items-center justify-center w-full max-w-5xl gap-4 relative z-10 transition-all duration-300 mt-2`}>
        
        {/* Left Player Card */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center shadow-lg min-h-[280px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A96]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {q.left_player_image && (
            <img src={q.left_player_image} alt={q.left_player_name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-4 border-white shadow-md mb-4 z-10 bg-slate-100" />
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-4 tracking-tight z-10">
            {q.left_player_name}
          </h2>
          <div className="text-4xl sm:text-5xl font-black text-[#0B2A96] drop-shadow-sm z-10">
            {Number(q.left_player_value).toLocaleString()}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-3 z-10">{q.stat_display}</p>
        </div>
 
        {/* VS Badge */}
        <div className="h-14 w-14 shrink-0 bg-[#0B2A96] text-white rounded-full flex items-center justify-center font-black text-xl z-20 -my-6 lg:my-0 lg:-mx-7 shadow-xl border-4 border-slate-50 shadow-[#0B2A96]/20">
          VS
        </div>
 
        {/* Right Player Card */}
        <div className={`flex-1 w-full bg-white border-2 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center shadow-lg min-h-[280px] transition-all duration-500 relative overflow-hidden ${isReveal ? 'border-[#0B2A96] shadow-[#0B2A96]/20' : 'border-slate-200 hover:border-[#0B2A96]/30'}`}>
          {q.right_player_image && (
            <img src={q.right_player_image} alt={q.right_player_name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-full border-4 border-white shadow-md mb-4 z-10 bg-slate-100" />
          )}
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-4 tracking-tight z-10">
            {q.right_player_name}
          </h2>
          
          {isReveal ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center z-10">
              <div className={`text-4xl sm:text-5xl font-black drop-shadow-sm flex items-center gap-3 text-[#0B2A96]`}>
                {Number(q.right_player_value).toLocaleString()}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">{q.stat_display}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full max-w-[200px] animate-in fade-in z-10">
              <button 
                onClick={() => onAnswer("HIGHER")}
                disabled={disabled}
                className={`w-full h-12 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${myAnswer === "HIGHER" ? 'bg-[#0B2A96] text-white shadow-lg scale-105' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'}`}
              >
                <ArrowUp className="h-5 w-5" /> HIGHER
              </button>
              <button 
                onClick={() => onAnswer("LOWER")}
                disabled={disabled}
                className={`w-full h-12 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${myAnswer === "LOWER" ? 'bg-rose-500 text-white shadow-lg border-rose-500 scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50'}`}
              >
                <ArrowDown className="h-5 w-5" /> LOWER
              </button>
              <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Than {q.left_player_name}
              </p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

function ArenaQuizRound({ 
  questionData, 
  onAnswer, 
  disabled, 
  myAnswer,
  correctAnswer,
  explanation,
  gameState
}: RoundProps) {
  const [visibleClues, setVisibleClues] = useState<number>(1);
  const clues = questionData?.clues || [];
  const options = questionData?.options || [];

  const isReveal = gameState === "answer_reveal";

  // Reveal clues progressively
  useEffect(() => {
    if (visibleClues >= clues.length || disabled || isReveal) return;
    const timer = setTimeout(() => {
      setVisibleClues(prev => Math.min(prev + 1, clues.length));
    }, 5000); // Reveal a new clue every 5 seconds
    return () => clearTimeout(timer);
  }, [visibleClues, disabled, clues.length, isReveal]);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black outfit-bold text-[#0B2A96] mb-6 uppercase tracking-wider text-center">
        Arena Quiz Gauntlet
      </h2>

      {/* Question Text */}
      <div className="w-full bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm text-center mb-6">
        <p className="text-lg font-bold text-slate-800 leading-relaxed">
          {questionData?.question}
        </p>
      </div>

      {/* Clues Card */}
      {clues.length > 0 && (
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 mb-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lightbulb className="h-5 w-5 text-[#0B2A96]" />
            <h3 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider">Unfolding Clues</h3>
          </div>

          <div className="space-y-3">
            {clues.map((clue: string, idx: number) => {
              const isUnlocked = (isReveal ? clues.length : visibleClues) > idx;
              return (
                <motion.div
                  key={idx}
                  className={`p-4 border rounded-2xl text-xs flex items-center justify-between transition-all duration-300 ${
                    isUnlocked 
                      ? "bg-blue-50/20 border-blue-100 text-slate-700 font-medium" 
                      : "bg-slate-50/50 border-slate-100/50 text-slate-400 animate-pulse"
                  }`}
                >
                  {isUnlocked ? (
                    <div className="flex gap-2">
                      <span className="font-extrabold text-[#0B2A96]">Clue {idx + 1}:</span>
                      <span className="font-medium leading-relaxed">{clue}</span>
                    </div>
                  ) : (
                    <span className="font-bold flex items-center gap-1.5">
                      🔒 Clue {idx + 1} locked (unfolds automatically)
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multiple Choice Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
        {options.map((option: string) => {
          const isMyAnswer = myAnswer === option;
          const isCorrect = option === correctAnswer;
          
          let btnStyle = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50";
          let iconNode = null;

          if (isReveal) {
            if (isCorrect) {
              btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold scale-[1.01] shadow-xs";
              iconNode = <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
            } else if (isMyAnswer) {
              btnStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold scale-[0.99]";
              iconNode = <XCircle className="h-5 w-5 text-rose-600 shrink-0" />;
            } else {
              btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
            }
          } else if (isMyAnswer) {
            btnStyle = "bg-[#0B2A96] text-white border-[#0B2A96] shadow-md scale-102";
          }

          return (
            <button
              key={option}
              disabled={disabled || isReveal}
              onClick={() => onAnswer(option)}
              className={`p-5 rounded-2xl border transition-all text-sm font-semibold flex items-center justify-between min-h-[70px] cursor-pointer ${btnStyle}`}
            >
              <span className="truncate text-left pr-2">{option}</span>
              {iconNode}
            </button>
          );
        })}
      </div>

      {/* Explanation text on reveal */}
      {isReveal && explanation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-700 w-full mb-6"
        >
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Did you know?</span>
            {explanation}
          </div>
        </motion.div>
      )}

      {/* Status Bar */}
      {myAnswer && !isReveal && (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center animate-pulse">
          Locked In: {myAnswer} (Waiting for Opponent)
        </p>
      )}

      {/* Question Profile / Metadata */}
      {(questionData.difficulty || questionData.era || (questionData.tags && questionData.tags.length > 0)) && (
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-xs text-[#0B2A96] uppercase tracking-wider">Question Profile</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {questionData.difficulty && (
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Difficulty</span>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                  questionData.difficulty.toLowerCase() === 'easy' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                  questionData.difficulty.toLowerCase() === 'medium' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                  questionData.difficulty.toLowerCase() === 'expert' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {questionData.difficulty}
                </span>
              </div>
            )}

            {questionData.era && (
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Era Timeline</span>
                <span className="font-bold text-[#1e293b] bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {questionData.era}
                </span>
              </div>
            )}
          </div>

          {questionData.tags && questionData.tags.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {questionData.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] font-semibold text-slate-650 bg-blue-50/50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectionsRaceRound({ 
  questionData, 
  onAnswer, 
  disabled, 
  myAnswer,
  correctAnswer,
  gameState
}: RoundProps) {
  const [tiles, setTiles] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [solvedCats, setSolvedCats] = useState<any[]>([]);
  const [mistakes, setMistakes] = useState(3);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const categories = questionData?.categories || [];
  const isReveal = gameState === "answer_reveal";

  // Initialize tiles
  useEffect(() => {
    if (questionData?.tiles) {
      setTiles(questionData.tiles);
    }
  }, [questionData?.tiles]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleTileClick = (tile: string) => {
    if (disabled || isReveal || solvedCats.some(c => c.items.includes(tile))) return;

    if (selected.includes(tile)) {
      setSelected(prev => prev.filter(t => t !== tile));
    } else if (selected.length < 4) {
      setSelected(prev => [...prev, tile]);
    }
  };

  const handleShuffle = () => {
    const unsolved = tiles.filter(t => !solvedCats.some(c => c.items.includes(t)));
    const solved = tiles.filter(t => solvedCats.some(c => c.items.includes(t)));
    
    const shuffled = [...unsolved];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setTiles([...solved, ...shuffled]);
  };

  const handleDeselect = () => {
    setSelected([]);
  };

  const handleSubmit = () => {
    if (selected.length !== 4) return;

    const matchedCat = categories.find((cat: any) => {
      const catItemsUpper = cat.items.map((i: string) => i.toUpperCase());
      return selected.every(t => catItemsUpper.includes(t.toUpperCase()));
    });

    if (matchedCat) {
      const newSolved = [...solvedCats, matchedCat];
      setSolvedCats(newSolved);
      setSelected([]);

      setTiles(prev => {
        const solvedTiles = prev.filter(t => newSolved.some(c => c.items.includes(t)));
        const unsolvedTiles = prev.filter(t => !newSolved.some(c => c.items.includes(t)));
        return [...solvedTiles, ...unsolvedTiles];
      });

      if (newSolved.length === 2) {
        onAnswer("2");
        showToast("Solved all connections!");
      }
    } else {
      const newMistakes = mistakes - 1;
      setMistakes(newMistakes);
      
      // Check if we are "one away" (3 of 4 match a category)
      let oneAway = false;
      categories.forEach((cat: any) => {
        const catItemsUpper = cat.items.map((i: string) => i.toUpperCase());
        const matchCount = selected.filter(t => catItemsUpper.includes(t.toUpperCase())).length;
        if (matchCount === 3) oneAway = true;
      });

      if (oneAway) {
        showToast("One away...");
      } else {
        showToast("Incorrect guess");
      }

      if (newMistakes === 0) {
        onAnswer(solvedCats.length.toString());
      }
    }
  };

  const DIFFICULTY_COLORS: any = {
    1: "bg-[#f9df6d] text-black border-[#efd45d]", // Yellow
    2: "bg-[#a0c35a] text-black border-[#92b54d]", // Green
    3: "bg-[#b0c4ef] text-black border-[#a1b5df]", // Blue
    4: "bg-[#ba81c5] text-white border-[#aa71b5]"  // Purple
  };

  const unsolvedTiles = tiles.filter(t => !solvedCats.some(c => c.items.includes(t)));

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black outfit-bold text-[#0B2A96] mb-6 uppercase tracking-wider text-center">
        Connections Race
      </h2>

      {/* Toast Message */}
      {toastMsg && (
        <div className="mb-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-full shadow-md animate-bounce">
          {toastMsg}
        </div>
      )}

      {/* Grid Container */}
      <div className="w-full space-y-2 mb-6">
        {/* Render Solved Categories */}
        {(isReveal ? categories : solvedCats).map((cat: any, i: number) => (
          <div 
            key={i} 
            className={`w-full p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs border ${
              DIFFICULTY_COLORS[cat.difficulty] || "bg-[#f9df6d] text-black border-[#efd45d]"
            }`}
          >
            <span className="font-extrabold uppercase tracking-widest text-xs mb-0.5">{cat.title}</span>
            <span className="text-xs font-medium">{cat.items.join(", ")}</span>
          </div>
        ))}

        {/* Render Unsolved Grid */}
        {!isReveal && unsolvedTiles.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {unsolvedTiles.map((tile: string) => {
              const isSelected = selected.includes(tile);
              const alreadyAnswered = myAnswer !== null;

              return (
                <button
                  key={tile}
                  disabled={disabled || alreadyAnswered}
                  onClick={() => handleTileClick(tile)}
                  className={`aspect-[4/3] rounded-xl flex items-center justify-center text-center p-2.5 font-bold uppercase text-[10px] sm:text-xs shadow-xs border transition-all duration-200 select-none cursor-pointer ${
                    isSelected 
                      ? 'bg-[#0B2A96] text-white border-[#0B2A96] scale-98 shadow-md' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50'
                  }`}
                >
                  {tile}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mistakes & Controls */}
      {!isReveal && myAnswer === null && (
        <div className="w-full flex flex-col items-center gap-4 mt-2">
          {/* Mistakes Remaining */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Mistakes remaining:</span>
            <div className="flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    i < mistakes ? "bg-[#0B2A96]" : "bg-slate-250"
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleShuffle}
              disabled={disabled}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              Shuffle
            </button>
            <button
              onClick={handleDeselect}
              disabled={disabled || selected.length === 0}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              Deselect All
            </button>
            <button
              onClick={handleSubmit}
              disabled={disabled || selected.length !== 4}
              className="px-5 py-2.5 bg-[#0B2A96] hover:bg-[#0f3a63] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/10 active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              Submit Guess
            </button>
          </div>
        </div>
      )}

      {/* Locked In Status */}
      {myAnswer !== null && !isReveal && (
        <div className="text-center space-y-2 mt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider animate-pulse">
            Locked In: Solved {myAnswer} / 2 groups (Waiting for Opponent)
          </p>
          <div className="flex gap-2 justify-center">
            {solvedCats.map((cat: any, i: number) => (
              <span key={i} className="text-[10px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full uppercase">
                {cat.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question Profile / Metadata */}
      {(questionData.difficulty || questionData.era || (questionData.tags && questionData.tags.length > 0)) && (
        <div className="w-full bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 mt-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-xs text-[#0B2A96] uppercase tracking-wider">Question Profile</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            {questionData.difficulty && (
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Difficulty</span>
                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                  questionData.difficulty.toLowerCase() === 'easy' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                  questionData.difficulty.toLowerCase() === 'medium' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                  questionData.difficulty.toLowerCase() === 'expert' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {questionData.difficulty}
                </span>
              </div>
            )}

            {questionData.era && (
              <div className="flex items-center gap-2 justify-between sm:justify-start">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Era Timeline</span>
                <span className="font-bold text-[#1e293b] bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {questionData.era}
                </span>
              </div>
            )}
          </div>

          {questionData.tags && questionData.tags.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {questionData.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] font-semibold text-slate-650 bg-blue-50/50 border border-slate-200/50 px-2.5 py-1 rounded-lg">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface GuessRecord {
  name: string;
  runs: number;
  matches: number;
  wickets: number;
  centuries: number;
  isCorrect: boolean;
}
function ArenaGuessWhoRound({ questionData, onAnswer, disabled, myAnswer, correctAnswer, gameState }: RoundProps) {
  const isReveal = gameState === "answer_reveal" || gameState === "scoreboard";
  const targetId = isReveal ? (questionData?.answer || correctAnswer || questionData?.playerName) : (questionData?.playerName);
  
  const clues = questionData?.clues || [];
  const [visibleClues, setVisibleClues] = useState<number>(1);

  // Preloaded stats from server
  const mysteryStats = questionData?.career;
  const mysteryBatting = questionData?.batting;
  const mysteryBowling = questionData?.bowling;
  const mysteryMilestones = questionData?.milestones;
  const mysteryImage = questionData?.playerImage;
  const mysteryTeamsCount = questionData?.teamsCount || 1;

  // Reveal clues progressively if not revealed
  useEffect(() => {
    if (visibleClues >= 3 || isReveal) return;
    const timer = setTimeout(() => {
      setVisibleClues(prev => Math.min(prev + 1, 3));
    }, 4000); 
    return () => clearTimeout(timer);
  }, [visibleClues, isReveal]);

  // Construct radar data (using the exact same logic as guess-who standalone game)
  const radarData: any[] = [];
  if (mysteryBatting || mysteryBowling) {
    const isBatter = (mysteryStats?.runs || 0) > 500;
    
    if (isBatter && mysteryBatting) {
      radarData.push(
        { subject: 'Aggression', A: Math.min(100, ((mysteryBatting.strike_rate || mysteryBatting.runs_per_ball * 100) * 100) / 180) },
        { subject: 'Consistency', A: Math.min(100, (mysteryStats?.runs || 0) / 50) },
        { subject: 'Finishing', A: Math.min(100, (mysteryBatting.boundary_percentage || 0) * 3) },
        { subject: 'Longevity', A: Math.min(100, (mysteryStats?.matches || 0) / 2) },
        { subject: 'Anchoring', A: Math.min(100, (mysteryBatting.dot_ball_percentage || 0) * 1.5) }
      );
    } else if (mysteryBowling) {
      radarData.push(
        { subject: 'Wicket Taker', A: Math.min(100, (mysteryStats?.wickets || 0) / 1.5) },
        { subject: 'Economy', A: 100 - Math.min(100, (mysteryBowling.economy || 8) * 8) },
        { subject: 'Strike Rate', A: 100 - Math.min(100, (mysteryBowling.bowling_strike_rate || 24) * 3) },
        { subject: 'Longevity', A: Math.min(100, (mysteryStats?.matches || 0) / 2) },
        { subject: 'Dot Pressure', A: Math.min(100, (mysteryBowling.dot_ball_percentage || 0) * 1.5) }
      );
    }
  }

  // If radarData is still empty, let's create a placeholder to keep UI consistent
  if (radarData.length === 0 && mysteryStats) {
    const runs = mysteryStats.runs || 0;
    const wickets = mysteryStats.wickets || 0;
    const matches = mysteryStats.matches || 0;
    radarData.push(
      { subject: 'Longevity', A: Math.min(100, (matches / 250) * 100) },
      { subject: 'Runs', A: Math.min(100, (runs / 6000) * 100) },
      { subject: 'Wickets', A: Math.min(100, (wickets / 150) * 100) },
      { subject: 'Consistency', A: runs > wickets * 15 ? 70 : 40 },
      { subject: 'Impact', A: 50 }
    );
  }

  return (
    <div className="w-full mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
      <GameHeader 
        title="Guess Who?"
        subtitle="Identify the mystery player based on the unfolding clues and career blueprint."
        backHref="/dashboard/arena"
        className="w-full max-w-6xl mb-4"
      />

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl">
        
        {/* LEFT COLUMN: Mystery Card */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col items-center space-y-6 lg:sticky lg:top-24">
          <div className="relative group w-full flex justify-center">
            <div className={`h-[300px] w-[300px] sm:h-[350px] sm:w-[350px] rounded-3xl overflow-hidden border-4 shadow-2xl transition-all duration-700 ${
              isReveal 
                ? 'border-emerald-500 shadow-emerald-500/10' 
                : 'border-[#0B2A96]/20 bg-slate-50'
            }`}>
              {isReveal && mysteryImage ? (
                <img src={mysteryImage} alt="Revealed" className="h-full w-full object-cover animate-in fade-in zoom-in duration-500 animate-duration-500" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#0B2A96]/5 to-[#0B2A96]/15 relative">
                  {radarData.length > 0 ? (
                    <div className="absolute inset-0 opacity-55 p-4">
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
          </div>

          <div className="text-center min-h-[60px] w-full flex flex-col justify-center">
            {isReveal ? (
              <div className="animate-in slide-in-from-bottom-4 fade-in">
                <h2 className="text-3xl font-black text-[#0B2A96]">{targetId}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.matches || 0} Matches</span>
                  {(mysteryStats?.runs || 0) > 0 && <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.runs} Runs</span>}
                  {(mysteryStats?.wickets || 0) > 0 && <span className="bg-slate-100 px-3 py-1 rounded-full">{mysteryStats?.wickets} Wickets</span>}
                </div>
              </div>
            ) : (
              <h2 className="text-sm font-extrabold text-slate-400 tracking-[0.2em] uppercase">Analyze Career Blueprint</h2>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Guess Input & Stats Grid */}
        <div className="w-full lg:flex-1 space-y-6">
          
          {/* Guess Input Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-4 text-center">Who is this player?</h3>
            
            <div className="relative w-full z-50">
              <PlayerAutocomplete 
                onSelect={(player) => {
                  if (!disabled) onAnswer(player.name);
                }}
                disabled={disabled || isReveal}
                placeholder={isReveal ? "Round Over!" : "Search player name..."}
              />
            </div>

            {myAnswer && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in zoom-in text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Your Guess Locked</p>
                <p className="text-xl font-black text-emerald-800">{myAnswer}</p>
              </div>
            )}
          </div>

          {/* Stats Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Career Base Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="h-24 w-24 text-[#0B2A96]" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#0B2A96]" />
                Career Base
              </h3>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <PremiumStatBox label="Matches" value={mysteryStats?.matches || "-"} highlight />
                <PremiumStatBox label="Total Runs" value={mysteryStats?.runs || "-"} />
                <PremiumStatBox label="Total Wickets" value={mysteryStats?.wickets || "-"} />
                <PremiumStatBox 
                  label={(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? "Highest Score" : "Best Bowling"} 
                  value={(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? (mysteryStats?.highest_score || "-") : (mysteryStats?.best_bowling_figures || "-")} 
                />
              </div>
            </div>

            {/* Deep Profile Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="h-24 w-24 text-[#0B2A96]" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0B2A96]" />
                Deep Profile
              </h3>
              
              {(mysteryStats?.runs || 0) > (mysteryStats?.wickets || 0) * 15 ? (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <PremiumStatBox 
                    label="Strike Rate" 
                    value={mysteryBatting?.strike_rate ? mysteryBatting.strike_rate.toFixed(1) : mysteryBatting?.runs_per_ball ? (mysteryBatting.runs_per_ball * 100).toFixed(1) : "-"} 
                    highlight 
                  />
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

          {/* Career Milestones */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#0B2A96]" />
              Career Milestones
            </h3>
            
            <div className="space-y-2">
              {(mysteryStats?.hundreds > 0 || mysteryStats?.fifties > 0 || mysteryStats?.highest_score || mysteryStats?.five_w > 0 || mysteryStats?.four_w > 0 || mysteryMilestones?.orange_caps || mysteryMilestones?.purple_caps) ? (
                <>
                  {/* Batting Milestones */}
                  {(mysteryStats?.hundreds || mysteryMilestones?.centuries) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">🏏 Hundreds</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats?.hundreds || mysteryMilestones?.centuries}</span>
                    </div>
                  )}
                  {(mysteryStats?.fifties || mysteryMilestones?.fifties) > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">🔥 50+ Scores</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats?.fifties || mysteryMilestones?.fifties}</span>
                    </div>
                  )}
                  {(mysteryStats?.highest_score || mysteryMilestones?.highest_score) && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">⭐ Highest Score</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats?.highest_score || mysteryMilestones?.highest_score}</span>
                    </div>
                  )}

                  {/* Bowling Milestones */}
                  {mysteryStats?.five_w > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">🎯 5-Wicket Hauls</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats.five_w}</span>
                    </div>
                  )}
                  {mysteryStats?.four_w > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">🎯 4-Wicket Hauls</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats.four_w}</span>
                    </div>
                  )}
                  {mysteryStats?.best_bowling_figures && mysteryStats?.wickets > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="font-medium text-slate-500 text-sm">✨ Best Bowling</span>
                      <span className="font-bold text-slate-800 text-base">{mysteryStats.best_bowling_figures}</span>
                    </div>
                  )}

                  {/* Caps */}
                  {mysteryMilestones?.orange_caps !== undefined && mysteryMilestones.orange_caps > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-[#0B2A98]/5 px-3 rounded-xl">
                      <span className="font-bold text-[#0B2A98] text-sm">🟠 Orange Caps</span>
                      <span className="font-bold text-[#0B2A98] text-base">{mysteryMilestones.orange_caps}</span>
                    </div>
                  )}
                  {mysteryMilestones?.purple_caps !== undefined && mysteryMilestones.purple_caps > 0 && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 bg-[#0B2A98]/5 px-3 rounded-xl">
                      <span className="font-bold text-[#0B2A98] text-sm">🟣 Purple Caps</span>
                      <span className="font-bold text-[#0B2A98] text-base">{mysteryMilestones.purple_caps}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-xl text-sm font-medium">No milestones available.</p>
              )}
            </div>
          </div>

          {/* Unfolding Clues */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#0B2A96]" />
              Mystery Clues
            </h3>
            
            <div className="space-y-3">
              {clues.map((clue: string, idx: number) => {
                const isUnlocked = visibleClues > idx || isReveal;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border rounded-2xl text-sm flex items-center justify-between transition-all duration-300 ${
                      isUnlocked 
                        ? "bg-[#0B2A96]/5 border-[#0B2A96]/10 text-slate-700 font-medium" 
                        : "bg-slate-50 border-slate-100 text-slate-400 animate-pulse"
                    }`}
                  >
                    {isUnlocked ? (
                      <div className="flex gap-3 items-start">
                        <span className="font-black text-[#0B2A96] text-lg leading-none mt-0.5">0{idx + 1}</span>
                        <span className="leading-snug">{clue}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-xs flex items-center gap-1.5">
                        🔒 Clue {idx + 1} locked (unfolds in a few seconds)
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function PremiumStatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-center transition-all duration-300 hover:-translate-y-0.5 ${
      highlight 
        ? 'bg-[#0B2A96] text-white border-[#0B2A96] shadow-[0_4px_15px_rgba(11,42,150,0.25)]' 
        : 'bg-slate-50/50 border-slate-200/60 hover:border-[#0B2A96]/40 hover:bg-slate-50'
    }`}>
      <p className={`text-[10px] uppercase tracking-widest font-extrabold mb-1.5 truncate ${highlight ? 'text-white/85' : 'text-slate-400'}`}>{label}</p>
      <p className="text-2xl font-black font-display">{value}</p>
    </div>
  );
}

function ArenaCareerPathRound({ questionData, onAnswer, disabled, myAnswer, correctAnswer, gameState }: RoundProps) {
  const [localGuesses, setLocalGuesses] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [teamsDb, setTeamsDb] = useState<any[]>([]);
  
  const MAX_GUESSES = 4;
  const isReveal = gameState === "answer_reveal" || gameState === "scoreboard";
  const journey = questionData?.journey || questionData?.teams || []; 
  
  useEffect(() => {
    async function loadTeams() {
      try {
        const teamRes = await getAllTeams();
        if (teamRes.success && teamRes.teams) setTeamsDb(teamRes.teams);
      } catch(e){}
    }
    loadTeams();
  }, []);

  const handleGuess = (playerName: string) => {
    if (disabled || isReveal || localGuesses.length >= MAX_GUESSES) return;
    
    const newGuesses = [...localGuesses, playerName];
    setLocalGuesses(newGuesses);
    
    // Send it to the server immediately. Server decides correctness!
    onAnswer(playerName);
    
    if (newGuesses.length >= MAX_GUESSES) {
      onAnswer("FAILED");
    }
    setQuery("");
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-black outfit-bold text-[#0B2A96] mb-4 text-center uppercase tracking-wide">
        Career Path Duel
      </h2>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-[#0B2A96]" />
            <h2 className="text-xl font-black text-[#0B2A96] uppercase tracking-widest">Journey</h2>
          </div>
          
          <div className="space-y-4">
            {journey.map((item: any, idx: number) => {
              const team = typeof item === 'string' ? item : item.team;
              const year = typeof item === 'string' ? null : item.year;
              
              const dbTeam = teamsDb.find(t => t.name.toLowerCase() === team.toLowerCase() || t.short_name.toLowerCase() === team.toLowerCase());
              return (
                <div key={idx} className="p-4 rounded-2xl border border-slate-100 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full overflow-hidden border border-blue-200 bg-white flex items-center justify-center p-2">
                      {dbTeam?.image_url ? (
                        <img src={dbTeam.image_url} alt={team} className="object-contain w-full h-full" />
                      ) : (
                        <div className="font-bold text-xs text-blue-900">{team.substring(0,3).toUpperCase()}</div>
                      )}
                    </div>
                    <p className="font-bold text-lg text-slate-800">{team}</p>
                  </div>
                  {year && (
                    <span className="text-xs font-black text-[#0B2A96] bg-[#0B2A96]/10 px-3 py-1 rounded-full">{year}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full md:w-[400px] flex flex-col gap-6">
          {!isReveal && !disabled && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4 text-[#0B2A96] flex items-center justify-between">
                Make Your Guess
                <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{MAX_GUESSES - localGuesses.length} left</span>
              </h2>
              <PlayerAutocomplete label="" placeholder="e.g., MS Dhoni" value={query} onChange={handleGuess} />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-3">Your Guesses</p>
            {Array.from({ length: MAX_GUESSES }).map((_, i) => {
              const guess = localGuesses[i];
              return (
                <div key={i} className={`p-3 rounded-xl border font-bold ${guess ? (isReveal && correctAnswer && guess.toLowerCase() === correctAnswer.toLowerCase() ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-500') : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {guess || `Guess ${i + 1}`}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {isReveal && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-8 text-center mt-6 animate-in zoom-in duration-500">
           <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-1">The Answer was</h3>
           <p className="text-3xl font-black text-emerald-900 outfit-bold">{correctAnswer}</p>
        </div>
      )}
    </div>
  );
}
