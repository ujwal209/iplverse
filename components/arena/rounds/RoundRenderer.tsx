"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, Lightbulb, Calendar } from "lucide-react";

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
  
  if (roundType === "WHO_AM_I" || roundType === "MATCH_MEMORY" || roundType === "MYSTERY_PLAYER") {
    // Both use progressive clues
    return <GroqClueRound roundType={roundType} questionData={questionData} gameState={gameState} onAnswer={onAnswer} disabled={disabled} myAnswer={myAnswer} correctAnswer={correctAnswer} explanation={explanation} />;
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

function GroqClueRound({ roundType, questionData, onAnswer, disabled, myAnswer }: RoundProps) {
  const [visibleClues, setVisibleClues] = useState<number>(1);
  const clues = questionData?.clues || [];

  // Reveal clues progressively
  useEffect(() => {
    if (visibleClues >= 4 || disabled) return;
    const timer = setTimeout(() => {
      setVisibleClues(prev => Math.min(prev + 1, 4));
    }, 4000); // Reveal a new clue every 4 seconds
    return () => clearTimeout(timer);
  }, [visibleClues, disabled]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <h2 className="text-3xl font-black outfit-bold text-primary mb-8 tracking-wide uppercase">
        {roundType === "WHO_AM_I" ? "Who Am I?" : "Match Memory"}
      </h2>

      <div className="w-full space-y-4 mb-8 min-h-[300px]">
        <AnimatePresence>
          {clues.slice(0, visibleClues).map((clue: string, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-card border-l-4 border-primary p-6 rounded-r-xl shadow-md flex gap-4 items-start"
            >
              <div className="bg-primary/20 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <p className="text-lg font-medium">{clue}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="w-full relative">
        <input 
          type="text" 
          placeholder="Type your guess and hit Enter..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) {
              onAnswer(e.currentTarget.value);
            }
          }}
          className="w-full h-14 bg-background border-2 border-border/50 rounded-xl px-6 text-lg font-bold focus:border-primary focus:outline-none disabled:opacity-50 transition-all"
        />
        {myAnswer && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground uppercase">
            Guessed: {myAnswer}
          </div>
        )}
      </div>
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

function StatSmashRound({ questionData, onAnswer, disabled, myAnswer }: RoundProps) {
  return (
    <div className="w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-4 fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold outfit-bold text-muted-foreground">{questionData.question}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border-2 border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg min-h-[250px]">
          <h3 className="text-3xl font-bold outfit-bold text-center mb-6">{questionData.player1}</h3>
          <button 
            onClick={() => onAnswer(questionData.player1)}
            disabled={disabled}
            className={`w-full h-14 font-bold rounded-xl transition-all ${
              myAnswer === questionData.player1 ? "bg-primary text-primary-foreground scale-105 shadow-lg" : "bg-muted hover:bg-primary/20 disabled:opacity-50"
            }`}
          >
            Higher
          </button>
        </div>

        <div className="bg-card border-2 border-border/50 rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg min-h-[250px]">
          <h3 className="text-3xl font-bold outfit-bold text-center mb-6">{questionData.player2}</h3>
          <button 
            onClick={() => onAnswer(questionData.player2)}
            disabled={disabled}
            className={`w-full h-14 font-bold rounded-xl transition-all ${
              myAnswer === questionData.player2 ? "bg-destructive text-destructive-foreground scale-105 shadow-lg" : "bg-muted hover:bg-destructive/20 disabled:opacity-50"
            }`}
          >
            Higher
          </button>
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
