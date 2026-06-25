"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Trophy, Activity, RotateCcw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getRandomStatSmashQuestion, submitDailyGame } from "@/app/actions/games";
import confetti from "canvas-confetti";
import { GameHeader } from "@/components/game/game-header";

export default function StatSmash() {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const fetchNextQuestion = async () => {
    setLoading(true);
    const res = await getRandomStatSmashQuestion();
    if (res.success && res.question) {
      setQuestion(res.question);
    }
    setLoading(false);
  };

  const handleGuess = (guess: "higher" | "lower") => {
    if (gameOver || animating || !question) return;
    
    const leftVal = Number(question.left_player_value);
    const rightVal = Number(question.right_player_value);
    
    let isCorrect = false;
    if (guess === "higher") {
      isCorrect = rightVal >= leftVal;
    } else {
      isCorrect = rightVal <= leftVal;
    }

    if (isCorrect) {
      setAnimating(true);
      setScore(s => s + 1);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#0B2A96', '#10B981', '#FBBF24']
      });
      setTimeout(() => {
        setAnimating(false);
        fetchNextQuestion();
      }, 1500);
    } else {
      setGameOver(true);
      submitDailyGame("stat_smash", score, score >= 5);
    }
  };

  const restartGame = () => {
    setScore(0);
    setGameOver(false);
    fetchNextQuestion();
  };

  if (loading && !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
        <Activity className="h-16 w-16 text-[#0B2A96] animate-pulse" />
        <h2 className="text-2xl font-black tracking-tight animate-pulse text-slate-500">Loading Stats...</h2>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="flex flex-col items-center justify-between lg:justify-start h-[100dvh] lg:h-auto lg:min-h-[80vh] w-full p-2 lg:p-8 space-y-2 lg:space-y-8 bg-slate-50 overflow-hidden lg:overflow-visible">
      <GameHeader 
        title="Stat Smash"
        subtitle={
          <span className="text-slate-600 text-[10px] lg:text-base leading-tight">
            Which player has a higher <span className="font-black text-[#0B2A96] uppercase tracking-wider">{question.stat_display}</span>?
          </span>
        }
        action={
          <div className="inline-flex items-center gap-2 px-3 py-2 lg:px-6 lg:py-3 bg-white rounded-xl lg:rounded-2xl text-[#0B2A96] font-black text-sm lg:text-lg shadow-sm border border-[#0B2A96]/10">
            <Trophy className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-500" />
            STREAK: {score}
          </div>
        }
      />

      {gameOver && (
        <div className="mt-2 lg:mt-6 text-center animate-in slide-in-from-top-8 fade-in flex flex-col items-center z-20 shrink-0">
          <h3 className="text-2xl lg:text-5xl font-black text-slate-900 mb-1 lg:mb-2 tracking-tight flex items-center gap-2 lg:gap-3">
            <XCircle className="w-6 h-6 lg:w-10 lg:h-10 text-red-500" />
            Streak Broken!
          </h3>
          <p className="text-sm lg:text-xl text-slate-600 mb-3 lg:mb-6 font-medium">You survived <span className="font-black text-[#0B2A96] text-xl lg:text-3xl mx-1 lg:mx-2">{score}</span> rounds</p>
          <button 
            onClick={restartGame}
            className="h-12 lg:h-16 px-6 lg:px-10 rounded-xl lg:rounded-2xl bg-[#0B2A96] hover:bg-[#082072] text-white font-black text-sm lg:text-lg uppercase tracking-widest flex items-center justify-center gap-2 lg:gap-3 shadow-xl hover:shadow-[#0B2A96]/30 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RotateCcw className="h-5 w-5 lg:h-6 lg:w-6" /> Play Again
          </button>
        </div>
      )}

      <div className={`flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl gap-2 lg:gap-6 relative z-10 flex-1 min-h-0 ${gameOver ? 'mt-2 lg:mt-6 opacity-75' : 'mt-2 lg:mt-12'} ${(loading && question) ? 'opacity-60 scale-[0.98] blur-[1px]' : ''} transition-all duration-300`}>
        
        {loading && question && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200/50 flex flex-col items-center gap-3 animate-in zoom-in-95 duration-200">
              <Loader2 className="h-8 w-8 text-[#0B2A96] animate-spin" />
              <span className="font-black text-slate-800 tracking-widest uppercase text-[10px]">Summoning Next Challenger</span>
            </div>
          </div>
        )}
        
        {/* Left Player Card */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-12 flex flex-col items-center justify-center shadow-xl min-h-[140px] lg:min-h-[350px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A96]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {question.left_player_image && (
            <img src={question.left_player_image} alt={question.left_player_name} className="w-12 h-12 lg:w-32 lg:h-32 object-cover rounded-full border-2 lg:border-4 border-white shadow-lg mb-2 lg:mb-6 z-10 bg-slate-100" />
          )}
          <h2 className="text-lg lg:text-5xl font-black text-slate-900 text-center mb-1 lg:mb-6 tracking-tight z-10 leading-none line-clamp-1">
            {question.left_player_name}
          </h2>
          <div className="text-4xl lg:text-7xl font-black text-[#0B2A96] drop-shadow-sm z-10 leading-none">
            {question.left_player_value.toLocaleString()}
          </div>
          <p className="text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 lg:mt-4 z-10 leading-none">{question.stat_display}</p>
        </div>
 
        {/* VS Badge */}
        <div className="h-8 w-8 lg:h-20 lg:w-20 shrink-0 bg-[#0B2A96] text-white rounded-full flex items-center justify-center font-black text-xs lg:text-2xl z-20 -my-3 lg:my-0 lg:-mx-10 shadow-xl lg:shadow-2xl border-2 lg:border-4 border-slate-50 shadow-[#0B2A96]/20">
          VS
        </div>
 
        {/* Right Player Card */}
        <div className={`flex-1 w-full bg-white border-2 rounded-[1.5rem] lg:rounded-[2.5rem] p-4 lg:p-12 flex flex-col items-center justify-center shadow-xl min-h-[140px] lg:min-h-[350px] transition-all duration-500 relative overflow-hidden ${gameOver ? 'border-red-500 shadow-red-500/20' : animating ? 'border-emerald-500 shadow-emerald-500/20' : 'border-slate-200 hover:border-[#0B2A96]/30'}`}>
          {question.right_player_image && (
            <img src={question.right_player_image} alt={question.right_player_name} className="w-12 h-12 lg:w-32 lg:h-32 object-cover rounded-full border-2 lg:border-4 border-white shadow-lg mb-2 lg:mb-6 z-10 bg-slate-100" />
          )}
          <h2 className="text-lg lg:text-5xl font-black text-slate-900 text-center mb-1 lg:mb-6 tracking-tight z-10 leading-none line-clamp-1">
            {question.right_player_name}
          </h2>
          
          {animating || gameOver ? (
            <div className="animate-in zoom-in duration-500 flex flex-col items-center z-10">
              <div className={`text-4xl lg:text-7xl font-black drop-shadow-sm flex items-center gap-2 lg:gap-4 leading-none ${gameOver ? 'text-red-500' : 'text-emerald-500'}`}>
                {question.right_player_value.toLocaleString()}
                {gameOver ? <XCircle className="w-6 h-6 lg:w-10 lg:h-10" /> : <CheckCircle2 className="w-6 h-6 lg:w-10 lg:h-10" />}
              </div>
              <p className="text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 lg:mt-4 leading-none">{question.stat_display}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 lg:gap-4 w-full max-w-[240px] animate-in fade-in z-10">
              <button 
                onClick={() => handleGuess("higher")}
                className="w-full h-12 lg:h-16 rounded-xl lg:rounded-2xl bg-slate-900 text-white font-black text-sm lg:text-lg tracking-widest uppercase flex items-center justify-center gap-2 lg:gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20 cursor-pointer"
              >
                <ArrowUp className="h-4 w-4 lg:h-6 lg:w-6" /> HIGHER
              </button>
              <button 
                onClick={() => handleGuess("lower")}
                className="w-full h-12 lg:h-16 rounded-xl lg:rounded-2xl bg-white border-2 border-slate-200 text-slate-600 font-black text-sm lg:text-lg tracking-widest uppercase flex items-center justify-center gap-2 lg:gap-3 hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <ArrowDown className="h-4 w-4 lg:h-6 lg:w-6" /> LOWER
              </button>
              <p className="text-center text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 lg:mt-2">
                Than {question.left_player_name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
