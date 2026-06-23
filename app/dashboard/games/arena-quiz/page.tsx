"use client";

import { useState, useEffect } from "react";
import { 
  Trophy, 
  RotateCcw, 
  ChevronRight, 
  Zap, 
  Info,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Calendar,
  AlertTriangle,
  Loader2
} from "lucide-react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { submitDailyGame, getArenaQuizQuestions } from "@/app/actions/games";
import { motion, AnimatePresence } from "framer-motion";

interface ArenaQuestion {
  id: string;
  format: string;
  interaction_type: string;
  difficulty: string;
  question_text: string;
  clues: string[];
  options: string[];
  correct_answer: string;
  metadata: {
    explanation?: string;
  };
  tags: string[];
  era: string;
}

const MOCK_QUESTIONS: ArenaQuestion[] = [
  {
    id: "q1",
    format: "guess_player",
    interaction_type: "multiple_choice",
    difficulty: "Medium",
    question_text: "Which captain holds the record for the most IPL wins with a single franchise, leading them to 5 titles and over 120 match victories?",
    clues: [
      "He has played in 10 IPL finals, the most by any player.",
      "His trademark helicopter shot is famous worldwide.",
      "He retired from international cricket on August 15, 2020."
    ],
    options: ["Gautam Gambhir", "MS Dhoni", "Rohit Sharma", "Virat Kohli"],
    correct_answer: "MS Dhoni",
    metadata: {
      explanation: "MS Dhoni captained Chennai Super Kings (CSK) to 5 IPL titles and has recorded the highest number of wins (133 wins) as an IPL captain."
    },
    tags: ["CSK", "Captain", "Legend", "Finisher"],
    era: "Dhoni Era"
  },
  {
    id: "q2",
    format: "guess_record",
    interaction_type: "multiple_choice",
    difficulty: "Hard",
    question_text: "Who was the first batsman to score a century in the history of the Indian Premier League during the opening match in 2008?",
    clues: [
      "He achieved this feat playing for Kolkata Knight Riders against Royal Challengers Bangalore.",
      "He scored an unbeaten 158 runs, hit 13 sixes and 10 fours.",
      "He is a former New Zealand captain known for his aggressive batting."
    ],
    options: ["Brendon McCullum", "Chris Gayle", "Adam Gilchrist", "Matthew Hayden"],
    correct_answer: "Brendon McCullum",
    metadata: {
      explanation: "Brendon McCullum scored 158* off 73 balls in the very first match of IPL in 2008, setting a blistering tone for the league."
    },
    tags: ["KKR", "Opener", "Century", "2008"],
    era: "Pre-IPL Era"
  },
  {
    id: "q3",
    format: "guess_bowler",
    interaction_type: "multiple_choice",
    difficulty: "Expert",
    question_text: "Which bowler holds the unique distinction of taking three hat-tricks in the Indian Premier League history, playing for different franchises?",
    clues: [
      "He is a leg-spinner who played for Deccan Chargers, Delhi Capitals, and Sunrisers Hyderabad.",
      "He is the first bowler to take 3 hat-tricks in the league.",
      "He has taken over 160 wickets in his IPL career."
    ],
    options: ["Yuzvendra Chahal", "Amit Mishra", "Piyush Chawla", "Harbhajan Singh"],
    correct_answer: "Amit Mishra",
    metadata: {
      explanation: "Amit Mishra has taken three hat-tricks in the IPL: in 2008 (for Delhi Daredevils), in 2011 (for Deccan Chargers), and in 2013 (for Sunrisers Hyderabad)."
    },
    tags: ["Hat-trick", "Spinner", "Record", "Deccan Chargers"],
    era: "2010s Era"
  }
];

export default function ArenaQuizPage() {
  const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [unlockedClues, setUnlockedClues] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const res = await getArenaQuizQuestions();
        if (res.success && res.questions && res.questions.length > 0) {
          setQuestions(res.questions);
        } else {
          // Fallback to shuffled/randomized MOCK_QUESTIONS
          const fallback = MOCK_QUESTIONS.map(q => {
            const shuffledOptions = [...q.options];
            for (let i = shuffledOptions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
            }
            return { ...q, options: shuffledOptions };
          });
          // Shuffle questions array
          for (let i = fallback.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fallback[i], fallback[j]] = [fallback[j], fallback[i]];
          }
          setQuestions(fallback);
        }
      } catch (err) {
        console.error("Error loading Arena Quiz questions:", err);
        setQuestions(MOCK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  const activeQuestion = questions[currentIdx];

  const handleOptionClick = (option: string) => {
    if (selectedOption !== null || !activeQuestion) return;
    
    setSelectedOption(option);
    
    if (option === activeQuestion.correct_answer) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 100);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      setWrongCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setUnlockedClues(0);
    } else {
      submitDailyGame("arena_quiz", score, correctCount > 0);
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    // Reshuffle questions on restart for strict randomness
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Reshuffle options as well
    const reshuffled = shuffled.map(q => {
      const shuffledOptions = [...q.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
      }
      return { ...q, options: shuffledOptions };
    });

    setQuestions(reshuffled);
    setCurrentIdx(0);
    setSelectedOption(null);
    setUnlockedClues(0);
    setIsCompleted(false);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#0B2A96]" />
        <p className="text-sm font-semibold text-slate-500">Loading trivia questions...</p>
      </div>
    );
  }

  if (questions.length === 0 || !activeQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
        <AlertTriangle className="h-10 w-10 text-[#0B2A96]" />
        <p className="text-sm font-semibold text-slate-500">No active quiz questions found in database.</p>
        <Link href="/dashboard" className="text-xs font-bold text-[#0B2A96] hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8 bg-gradient-to-b from-slate-50 via-white to-blue-50/20 min-h-[85vh] rounded-3xl">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-5">
        <div>
          <Link href="/dashboard" className="text-xs font-bold text-[#0B2A96] hover:text-[#0f3a63] transition-colors flex items-center gap-1">
            ← Back to Play Zone
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold outfit-bold text-[#0B2A96] mt-1.5 tracking-tight">
            Arena Quiz
          </h1>
          <p className="text-xs text-slate-500 inter-medium mt-1">Solve trivia queries generated from real match records and stats.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-[#0B2A96] to-blue-500 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20"
          >
            <Zap className="h-4 w-4 fill-current text-white animate-bounce" />
            <span>Score: {score} pts</span>
          </motion.div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isCompleted ? (
          <motion.div 
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto text-center bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
            
            <div className="inline-flex items-center justify-center h-20 w-20 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-500 mb-6 shadow-sm">
              <Trophy className="h-10 w-10 text-emerald-600 animate-pulse" />
            </div>

            <h2 className="text-3xl font-black text-slate-800 outfit-bold mb-3">Arena Quiz Complete!</h2>
            <p className="text-slate-400 text-sm mb-8">Fantastic job! You've tackled all questions in this session.</p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 max-w-xs mx-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Score</div>
              <div className="text-4xl font-extrabold text-[#0B2A96] font-mono">{score} <span className="text-slate-400 text-sm font-semibold">XP</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm mx-auto">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Questions Played</div>
                <div className="text-xl font-bold text-slate-700">{questions.length}</div>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3">
                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Correct Answers</div>
                <div className="text-xl font-bold text-emerald-600">{correctCount}</div>
              </div>
              <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-3">
                <div className="text-[9px] font-bold text-rose-600 uppercase tracking-wider mb-1">Wrong Answers</div>
                <div className="text-xl font-bold text-rose-600">{wrongCount}</div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-3">
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1">Accuracy</div>
                <div className="text-xl font-bold text-blue-600">
                  {questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0}%
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleReset}
                className="h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Restart Quiz
              </button>
              <Link 
                href="/dashboard"
                className="h-12 px-6 bg-[#0B2A96] hover:bg-[#0B2A96]/95 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm shadow-blue-500/10"
              >
                Go to Dashboard
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
          >
            {/* LEFT COLUMN: Main Trivia Console */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Question Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2A96] to-blue-400" />
                
                {/* Meta details */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold text-[#0B2A96] uppercase tracking-wider">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  
                  {/* Stats Counter */}
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4.5 w-4.5" /> Correct: {correctCount}
                    </span>
                    <span className="text-rose-600 flex items-center gap-1">
                      <XCircle className="h-4.5 w-4.5" /> Incorrect: {wrongCount}
                    </span>
                  </div>
                </div>

                {/* Question text */}
                <h2 className="text-lg sm:text-xl font-bold outfit-bold text-slate-800 leading-relaxed">
                  {activeQuestion.question_text}
                </h2>

                {/* Multiple choice options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {activeQuestion.options.map((option) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === activeQuestion.correct_answer;
                    
                    let btnStyle = "bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300";
                    let iconNode = null;

                    if (selectedOption !== null) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold scale-[1.01] shadow-xs";
                        iconNode = <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />;
                      } else if (isSelected) {
                        btnStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold scale-[0.99]";
                        iconNode = <XCircle className="h-5 w-5 text-rose-600 shrink-0" />;
                      } else {
                        btnStyle = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleOptionClick(option)}
                        disabled={selectedOption !== null}
                        className={`h-14 px-5 border rounded-2xl text-left text-sm font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-[0.99] ${btnStyle}`}
                      >
                        <span className="truncate">{option}</span>
                        {iconNode}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation text on reveal */}
                {selectedOption !== null && activeQuestion.metadata.explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-blue-700"
                  >
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5">Did you know?</span>
                      {activeQuestion.metadata.explanation}
                    </div>
                  </motion.div>
                )}

                {/* Footer buttons */}
                {selectedOption !== null && (
                  <div className="border-t border-slate-100 pt-5 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="px-6 h-12 bg-[#0B2A96] hover:bg-[#0f3a63] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-[0.98] shadow-sm shadow-blue-500/10 cursor-pointer"
                    >
                      {currentIdx + 1 < questions.length ? (
                        <>
                          Next Question <ChevronRight className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Complete Quiz <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Clues Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Lightbulb className="h-5 w-5 text-[#0B2A96]" />
                  <h3 className="font-extrabold text-sm text-slate-700 uppercase tracking-wider">Unlockable Clues</h3>
                </div>

                <div className="space-y-3">
                  {activeQuestion.clues.map((clue, idx) => {
                    const isUnlocked = unlockedClues > idx;
                    return (
                      <motion.div
                        key={idx}
                        className={`p-4 border rounded-2xl text-xs flex items-center justify-between transition-all duration-300 ${
                          isUnlocked 
                            ? "bg-blue-50/20 border-blue-100 text-slate-700" 
                            : "bg-slate-50/50 border-slate-100/50 text-slate-400"
                        }`}
                      >
                        {isUnlocked ? (
                          <div className="flex gap-2">
                            <span className="font-extrabold text-[#0B2A96]">Clue {idx + 1}:</span>
                            <span className="font-medium leading-relaxed">{clue}</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-bold flex items-center gap-1">
                              🔒 Clue {idx + 1} locked
                            </span>
                            <button
                              onClick={() => setUnlockedClues(idx + 1)}
                              disabled={selectedOption !== null}
                              className="px-3 py-1 bg-[#0B2A96] text-white font-bold text-[10px] rounded-lg hover:bg-[#082072] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Unlock Clue
                            </button>
                          </>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Database Question Stats Profile */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#0B2A96]/20" />
                
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-extrabold text-sm text-[#0B2A96] uppercase tracking-wider">Question Profile</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">Properties of this quiz query.</p>
                </div>

                {/* General Metadata */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Difficulty</span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${
                      activeQuestion.difficulty === 'Easy' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      activeQuestion.difficulty === 'Medium' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      activeQuestion.difficulty === 'Expert' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {activeQuestion.difficulty}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Era Timeline</span>
                    <span className="font-bold text-[#1e293b] bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-lg text-xs flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {activeQuestion.era}
                    </span>
                  </div>
                </div>

                {/* Tags panel */}
                {activeQuestion.tags && activeQuestion.tags.length > 0 && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeQuestion.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold text-slate-600 bg-blue-50/50 border border-slate-200/50 px-2.5 py-1 rounded-lg hover:border-[#0B2A96]/30 transition-colors">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
