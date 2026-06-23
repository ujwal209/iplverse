"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Swords, 
  Calendar, 
  Trophy, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock, 
  HelpCircle, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  AlertCircle,
  Play
} from "lucide-react";
import { getMatchHistory } from "@/app/actions/arena";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function MatchHistoryPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  // Expanded match IDs to show detailed round logs
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await getMatchHistory();
        if (res.success && res.matches) {
          // Filter to show matches that have a history logged
          setMatches(res.matches);
          setCurrentUserId(res.currentUserId || "");
        } else {
          toast.error(res.error || "Failed to load match history");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading match history");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const toggleExpand = (matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  const getFormatLabel = (format: string) => {
    const labels: any = {
      mixed: "Mixed Formats",
      guess_who: "Guess Who Only",
      stat_smash: "Stat Smash Only",
      guess_match: "Guess the Match Only",
      career_path: "Career Path Only",
      connections: "Connections Only",
      arena_quiz: "Arena Quiz Only"
    };
    return labels[format] || format;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#0B2A96]" />
        <p className="text-sm font-semibold text-slate-500">Loading your match results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-[85vh]">
      
      {/* Back button */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#0B2A96] transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="border-b border-slate-200 pb-5 mb-8">
        <h1 className="text-3xl font-black outfit-bold text-[#1E293B] flex items-center gap-2">
          <Trophy className="h-8 w-8 text-[#0B2A96]" />
          Match History & Results
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Review details of your completed 1v1 Battle Arena matches, round choices, and scores.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-[#0B2A96]/5 text-[#0B2A96] rounded-full mb-4">
            <Swords className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 outfit-bold">No Matches Found</h2>
          <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
            You haven't played any 1v1 Battle Arena matches yet. Challenge a friend or host a room from the dashboard!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-11 px-6 bg-[#0B2A96] text-white text-xs font-bold rounded-xl mt-6 hover:bg-[#0B2A96]/95 transition-all shadow-xs active:scale-[0.98]"
          >
            Create Multiplayer Match
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const isHost = match.host_id === currentUserId;
            
            // Opponent resolution
            const opponentUsername = isHost 
              ? (match.guest?.username || "Guest Opponent") 
              : (match.host?.username || "Host Opponent");
            
            // Score resolution
            const userScore = isHost ? match.host_score : match.guest_score;
            const oppScore = isHost ? match.guest_score : match.host_score;

            const isFinished = match.status === 'finished';
            
            // Outcome resolution
            let outcome: "victory" | "defeat" | "tie" = "tie";
            if (isFinished) {
              if (match.winner_id) {
                outcome = match.winner_id === currentUserId ? "victory" : "defeat";
              } else {
                if (userScore > oppScore) outcome = "victory";
                else if (userScore < oppScore) outcome = "defeat";
              }
            }

            const isExpanded = expandedMatchId === match.id;
            const matchHistoryList = match.match_history || [];

            return (
              <div 
                key={match.id}
                className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs hover:border-slate-300 transition-all duration-300"
              >
                {/* Match Summary Row */}
                <div 
                  onClick={() => toggleExpand(match.id)}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {/* Outcome Badge */}
                      {!isFinished ? (
                        <span className="bg-amber-50 text-amber-600 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-200/50 flex items-center gap-1.5 animate-pulse">
                          <span className="h-1.5 w-1.5 bg-amber-500 rounded-full"></span>
                          In Progress
                        </span>
                      ) : outcome === "victory" ? (
                        <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-200/50">
                          Victory
                        </span>
                      ) : outcome === "defeat" ? (
                        <span className="bg-rose-50 text-rose-600 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-rose-200/50">
                          Defeat
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-200/50">
                          Tie
                        </span>
                      )}
                      
                      <span className="text-slate-400 text-xs flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(match.created_at).toLocaleDateString(undefined, { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric" 
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-700 outfit-bold flex items-center gap-2">
                      <span>vs</span>
                      <span className="text-[#0B2A96] font-extrabold">{opponentUsername}</span>
                      <span className="text-slate-300 font-normal">|</span>
                      <span className="font-mono text-slate-500 tracking-wider">Room: {match.room_code}</span>
                    </h3>

                    {/* Rules badges */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-100">
                        {getFormatLabel(match.game_format)}
                      </span>
                      <span className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-100">
                        {match.time_limit === 0 ? "Unlimited" : `${match.time_limit}s Timer`}
                      </span>
                      <span className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-100">
                        {match.difficulty}
                      </span>
                      <span className="bg-slate-50 text-slate-500 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border border-slate-100">
                        {matchHistoryList.length} / {match.max_rounds} Rounds
                      </span>
                    </div>
                  </div>

                  {/* Right Score section */}
                  <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isFinished ? "Final Score" : "Current Score"}
                      </div>
                      <div className="text-2xl font-black text-[#1E293B] outfit-bold font-mono">
                        {userScore} <span className="text-slate-300 font-normal">-</span> {oppScore}
                      </div>
                    </div>

                    {!isFinished && (
                      <Link
                        href={`/dashboard/arena/${match.room_code}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-[#0B2A96] to-[#0f3a63] hover:from-[#155691] hover:to-[#0B2A96] text-white font-extrabold text-[11px] rounded-xl shadow-xs hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Continue Match <span className="text-[9px] opacity-90 font-mono bg-white/20 px-1.5 py-0.5 rounded ml-1 font-bold">Code: {match.room_code}</span>
                      </Link>
                    )}

                    <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                </div>

                {/* Round Details Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-slate-100 bg-slate-50/50"
                    >
                      <div className="p-5 sm:p-6 space-y-4">
                        <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <Activity className="h-3.5 w-3.5 text-[#0B2A96]" />
                          Round-by-Round Result Log
                        </h4>

                        {matchHistoryList.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4" /> No round data recorded for this match.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {matchHistoryList.map((round: any, idx: number) => {
                              // Identify answers
                              const userAns = isHost ? round.host_answer : round.guest_answer;
                              const oppAns = isHost ? round.guest_answer : round.host_answer;
                              const correctAns = round.correct_answer;

                              // Verify correctness
                              const isUserCorrect = userAns && correctAns && 
                                (userAns.toString().toLowerCase().trim().includes(correctAns.toString().toLowerCase().trim()) ||
                                 correctAns.toString().toLowerCase().trim().includes(userAns.toString().toLowerCase().trim()));
                              
                              const isOppCorrect = oppAns && correctAns && 
                                (oppAns.toString().toLowerCase().trim().includes(correctAns.toString().toLowerCase().trim()) ||
                                 correctAns.toString().toLowerCase().trim().includes(oppAns.toString().toLowerCase().trim()));

                              // Retrieve question text / preview
                              const questionText = round.question?.text || round.question?.clues?.[0] || round.question?.clue || "Trivia Question";
                              const choices = round.question?.choices || [];

                              return (
                                <div 
                                  key={idx}
                                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-3"
                                >
                                  {/* Round Header */}
                                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-[#0B2A96] uppercase">
                                      Round {round.round}: {getFormatLabel(round.type)}
                                    </span>
                                    {round.winner === "TIE" ? (
                                      <span className="text-[9px] font-bold text-slate-400 uppercase">Tie Round</span>
                                    ) : round.winner === currentUserId ? (
                                      <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Round Won</span>
                                    ) : round.winner === "NONE" ? (
                                      <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">No Winner</span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Round Lost</span>
                                    )}
                                  </div>

                                  {/* Question */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5">Question</span>
                                    <p className="text-slate-800 text-xs font-semibold leading-relaxed pl-0.5">
                                      {questionText}
                                    </p>
                                  </div>

                                  {/* Options (if multiple choice) */}
                                  {choices.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-0.5 font-semibold">Options</span>
                                      <div className="grid grid-cols-2 gap-2 mt-1">
                                        {choices.map((choice: string, cIdx: number) => {
                                          const isChoiceCorrect = choice.toString().toLowerCase().trim() === correctAns.toString().toLowerCase().trim();
                                          return (
                                            <div 
                                              key={cIdx}
                                              className={`p-2 rounded-xl text-[10px] font-medium border ${
                                                isChoiceCorrect 
                                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" 
                                                  : "bg-slate-50 border-slate-100 text-slate-500"
                                              }`}
                                            >
                                              {choice} {isChoiceCorrect && "✓"}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Player selections */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                                    {/* User selection */}
                                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Selection</div>
                                      <div className="flex items-center gap-1.5">
                                        {isUserCorrect ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                        )}
                                        <span className={`text-[11px] font-bold ${isUserCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                                          {userAns === "TIMEOUT" ? "⌛ TIMEOUT" : (userAns || "No Answer")}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Opponent selection */}
                                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">{opponentUsername}'s Selection</div>
                                      <div className="flex items-center gap-1.5">
                                        {isOppCorrect ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                        )}
                                        <span className={`text-[11px] font-bold ${isOppCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                                          {oppAns === "TIMEOUT" ? "⌛ TIMEOUT" : (oppAns || "No Answer")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Correct answer text if not multiple choice */}
                                  {choices.length === 0 && (
                                    <div className="bg-emerald-50/50 border border-emerald-100/50 p-2 rounded-xl text-left pl-3">
                                      <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Correct Answer</div>
                                      <div className="text-[11px] font-bold text-emerald-700 mt-0.5">{correctAns || "N/A"}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
