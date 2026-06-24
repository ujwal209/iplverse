"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@clerk/nextjs";
import { 
  createOrJoinMatch, 
  advanceArenaState, 
  updateMatchState, 
  generateNextArenaRound, 
  saveMatchHistory,
  sendArenaChatMessage,
  getArenaChatHistory,
  requestRematch
} from "@/app/actions/arena";
import { getAllTeams } from "@/app/actions/games";
import { getUserProfile } from "@/app/actions/social";
import { 
  Users, 
  Loader2, 
  Trophy, 
  AlertCircle, 
  Copy, 
  Check, 
  Activity, 
  Swords, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Send
} from "lucide-react";
import confetti from "canvas-confetti";
import { RoundRenderer } from "@/components/arena/rounds/RoundRenderer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Initialize Supabase Client for Realtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { CustomSelect } from "@/components/ui/custom-select";

const gameFormatOptions = [
  { value: "mixed", label: "Mixed Formats" },
  { value: "guess_who", label: "Guess Who" },
  { value: "stat_smash", label: "Stat Smash" },
  { value: "guess_match", label: "Guess the Match" },
  { value: "career_path", label: "Career Path" },
  { value: "connections", label: "Connections" },
  { value: "arena_quiz", label: "Arena Quiz" },
];

const timeLimitOptions = [
  { value: 15, label: "15 Seconds" },
  { value: 30, label: "30 Seconds" },
  { value: 60, label: "60 Seconds" },
  { value: 0, label: "Unlimited" },
];

const maxRoundsOptions = [
  { value: 3, label: "3 Rounds" },
  { value: 5, label: "5 Rounds" },
  { value: 7, label: "7 Rounds" },
  { value: 10, label: "10 Rounds" },
];

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

type ArenaState = "waiting" | "ready" | "countdown" | "generating_round" | "question" | "answer_reveal" | "next_round" | "scoreboard" | "match_complete";

export default function ArenaRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const router = useRouter();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let gid = localStorage.getItem("iplverse_guest_id");
      if (!gid) {
        gid = `guest_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem("iplverse_guest_id", gid);
      }
      setGuestId(gid);
    }
  }, []);

  const [matchRecord, setMatchRecord] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState<ArenaState>("waiting");
  const [countdown, setCountdown] = useState(3);
  
  const [hostScore, setHostScore] = useState(0);
  const [guestScore, setGuestScore] = useState(0);
  
  const [hostReady, setHostReady] = useState(false);
  const [guestReady, setGuestReady] = useState(false);

  const [question, setQuestion] = useState<any>(null);
  const [roundType, setRoundType] = useState<string>("");
  const [roundData, setRoundData] = useState<any>(null);
  
  const [hostAnswer, setHostAnswer] = useState<any>(null);
  const [guestAnswer, setGuestAnswer] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const channelRef = useRef<any>(null);
  const isRevealingRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const clockSkewRef = useRef(0);
  const countdownIntervalRef = useRef<any>(null);
  
  // Custom configurations
  const [timeLimit, setTimeLimit] = useState(30);
  const [gameFormat, setGameFormat] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [maxRounds, setMaxRounds] = useState(7);
  const [roundNumber, setRoundNumber] = useState(1);

  // Usernames
  const [hostUsername, setHostUsername] = useState("Host");
  const [guestUsername, setGuestUsername] = useState("Guest");

  // Chat configurations
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Teams DB for branding
  const [teamsDb, setTeamsDb] = useState<any[]>([]);

  const myDbUserId = matchRecord ? (isHost ? matchRecord.host_id : matchRecord.guest_id) : "";

  // 1. Join Room & Fetch DB State
  useEffect(() => {
    if (!isClerkLoaded) return;
    
    const activeUserId = user ? user.id : guestId;
    if (!activeUserId || !roomId) return;
    
    async function init() {
      const res = await createOrJoinMatch(roomId, undefined, user ? undefined : activeUserId);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.serverTime) {
        clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
      }
      setMatchRecord(res.match);
      setIsHost(!!res.isHost);
      setGameState(res.match.current_state || "waiting");
      setHostScore(res.match.host_score || 0);
      setGuestScore(res.match.guest_score || 0);
      setQuestion(res.match.current_question);
      setRoundType(res.match.round_type || "");
      setRoundData(res.match.current_round_data);
      setHostAnswer(res.match.host_answer);
      setGuestAnswer(res.match.guest_answer);
      setRoundNumber(res.match.round_number || 1);
      
      // Initialize ready/rematch states from database fields
      if (res.match.current_state === "ready") {
        setHostReady(res.match.host_answer === "READY");
        setGuestReady(res.match.guest_answer === "READY");
      } else if (res.match.current_state === "match_complete") {
        setHostReady(res.match.host_answer === "REMATCH");
        setGuestReady(res.match.guest_answer === "REMATCH");
      } else {
        setHostReady(false);
        setGuestReady(false);
      }
      
      // Load configurations
      setTimeLimit(res.match.time_limit !== undefined ? res.match.time_limit : 30);
      setGameFormat(res.match.game_format || "mixed");
      setDifficulty(res.match.difficulty || "medium");
      setMaxRounds(res.match.max_rounds || 7);

      // Load chat history
      const chatRes = await getArenaChatHistory(res.match.id);
      if (chatRes.success && chatRes.messages) {
        setChatMessages(chatRes.messages);
      }

      // Load teams DB for branding
      const teamsRes = await getAllTeams();
      if (teamsRes.success && teamsRes.teams) {
        setTeamsDb(teamsRes.teams);
      }

      // If guest joined, and state is waiting, advance to ready
      if (!res.isHost && (res.match.current_state === 'waiting' || !res.match.current_state)) {
        await advanceArenaState(res.match.id, 'ready');
        broadcastState('ready', { guestId: res.match.guest_id });
      }
    }
    init();
  }, [user, isClerkLoaded, guestId, roomId]);

  // Fetch usernames
  useEffect(() => {
    if (!matchRecord) return;
    
    async function fetchUsernames() {
      if (matchRecord.host_id) {
        const hostProfile = await getUserProfile(matchRecord.host_id);
        if (hostProfile) setHostUsername(hostProfile.username);
      }
      if (matchRecord.guest_id) {
        const guestProfile = await getUserProfile(matchRecord.guest_id);
        if (guestProfile) setGuestUsername(guestProfile.username);
      }
    }
    
    fetchUsernames();
  }, [matchRecord?.host_id, matchRecord?.guest_id]);

  // 2. Realtime Subscription (Sync State & Live Chat)
  useEffect(() => {
    if (!(user || guestId) || !matchRecord) return;

    const channel = supabase.channel(`arena:${roomId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "sync_state" }, ({ payload }) => {
        if (payload.state) {
          setGameState(payload.state);
          if (payload.state === "countdown" || payload.state === "generating_round" || payload.state === "ready" || payload.state === "waiting") {
            setQuestion(null);
            setRoundData(null);
            setHostAnswer(null);
            setGuestAnswer(null);
          }
        }
        if (payload.hostScore !== undefined) setHostScore(payload.hostScore);
        if (payload.guestScore !== undefined) setGuestScore(payload.guestScore);
        if (payload.hostReady !== undefined) setHostReady(payload.hostReady);
        if (payload.guestReady !== undefined) setGuestReady(payload.guestReady);
        if (payload.question !== undefined) setQuestion(payload.question);
        if (payload.roundType !== undefined) setRoundType(payload.roundType);
        if (payload.roundData !== undefined) setRoundData(payload.roundData);
        if (payload.hostAnswer !== undefined) setHostAnswer(payload.hostAnswer);
        if (payload.guestAnswer !== undefined) setGuestAnswer(payload.guestAnswer);
        if (payload.countdown !== undefined) setCountdown(payload.countdown);
        if (payload.roundNumber !== undefined) setRoundNumber(payload.roundNumber);
        
        // Handle roundExpiresAt in broadcast payload
        if (payload.roundExpiresAt !== undefined) {
          setMatchRecord((prev: any) => prev ? { ...prev, round_expires_at: payload.roundExpiresAt } : null);
        }
        
        // Sync configuration adjustments
        if (payload.timeLimit !== undefined) setTimeLimit(payload.timeLimit);
        if (payload.gameFormat !== undefined) setGameFormat(payload.gameFormat);
        if (payload.difficulty !== undefined) setDifficulty(payload.difficulty);
        if (payload.maxRounds !== undefined) setMaxRounds(payload.maxRounds);

        // guest joined sync
        if (payload.guestId !== undefined) {
          setMatchRecord((prev: any) => prev ? { ...prev, guest_id: payload.guestId } : null);
        }
      })
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        setChatMessages(prev => [...prev, payload.message]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "arena_matches",
          filter: `id=eq.${matchRecord.id}`,
        },
        (payload) => {
          const updatedMatch = payload.new;
          if (!updatedMatch) return;
          
          setMatchRecord(updatedMatch);
          if (updatedMatch.current_state) {
            setGameState(updatedMatch.current_state);
            if (updatedMatch.current_state === "countdown" || updatedMatch.current_state === "generating_round" || updatedMatch.current_state === "ready" || updatedMatch.current_state === "waiting") {
              setQuestion(null);
              setRoundData(null);
              setHostAnswer(null);
              setGuestAnswer(null);
            }
          }
          if (updatedMatch.host_score !== undefined) setHostScore(updatedMatch.host_score);
          if (updatedMatch.guest_score !== undefined) setGuestScore(updatedMatch.guest_score);
          
          // Map host_answer/guest_answer to ready states for lobby and rematch
          if (updatedMatch.current_state === "ready") {
            setHostReady(updatedMatch.host_answer === "READY");
            setGuestReady(updatedMatch.guest_answer === "READY");
          } else if (updatedMatch.current_state === "match_complete") {
            setHostReady(updatedMatch.host_answer === "REMATCH");
            setGuestReady(updatedMatch.guest_answer === "REMATCH");
          }
          if (updatedMatch.current_question !== undefined) setQuestion(updatedMatch.current_question);
          if (updatedMatch.round_type !== undefined) setRoundType(updatedMatch.round_type);
          if (updatedMatch.current_round_data !== undefined) setRoundData(updatedMatch.current_round_data);
          if (updatedMatch.host_answer !== undefined) setHostAnswer(updatedMatch.host_answer);
          if (updatedMatch.guest_answer !== undefined) setGuestAnswer(updatedMatch.guest_answer);
          if (updatedMatch.round_number !== undefined) setRoundNumber(updatedMatch.round_number);
          
          if (updatedMatch.time_limit !== undefined) setTimeLimit(updatedMatch.time_limit);
          if (updatedMatch.game_format !== undefined) setGameFormat(updatedMatch.game_format);
          if (updatedMatch.difficulty !== undefined) setDifficulty(updatedMatch.difficulty);
          if (updatedMatch.max_rounds !== undefined) setMaxRounds(updatedMatch.max_rounds);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, guestId, matchRecord]);

  const broadcastState = (state: ArenaState, extraPayload = {}) => {
    if (!channelRef.current) return;
    setGameState(state);
    channelRef.current.send({
      type: "broadcast",
      event: "sync_state",
      payload: { state, ...extraPayload }
    });
  };

  const syncPartialState = (payload: any) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "sync_state",
      payload
    });
  };

  // 3. State Machine Driver (Host Only)
  useEffect(() => {
    if (!isHost || !matchRecord) return;

    if (gameState === "question") {
      // Check if both have locked answers (e.g. they both failed or both played 1-guess games)
      if (hostAnswer && guestAnswer) {
        triggerAnswerReveal();
      } else if (roundData) {
        // RACE CONDITION: If anyone gets it right, immediately reveal!
        const hostCorrect = checkCorrectness(hostAnswer, roundData.answer, roundType);
        const guestCorrect = checkCorrectness(guestAnswer, roundData.answer, roundType);
        
        if (hostCorrect || guestCorrect) {
          triggerAnswerReveal();
        }
      }
    }

    // Self-healing & transition driver on page refreshes or updates
    if (gameState === "answer_reveal") {
      isRevealingRef.current = true;
      const timer = setTimeout(async () => {
        const res = await advanceArenaState(matchRecord.id, "scoreboard");
        if (res?.serverTime) {
          clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
        }
        broadcastState("scoreboard");
        
        // Save round history (ensure only once)
        const correctAnswer = roundData?.answer;
        const hostCorrect = checkCorrectness(hostAnswer, correctAnswer, roundType);
        const guestCorrect = checkCorrectness(guestAnswer, correctAnswer, roundType);
        
        const alreadySaved = matchRecord.match_history?.some((h: any) => h.round === roundNumber);
        if (!alreadySaved) {
          await saveMatchHistory(matchRecord.id, {
            round: roundNumber,
            type: roundType,
            question: question,
            correct_answer: correctAnswer,
            host_answer: hostAnswer,
            guest_answer: guestAnswer,
            winner: hostCorrect && guestCorrect ? "TIE" : hostCorrect ? matchRecord.host_id : guestCorrect ? matchRecord.guest_id : "NONE"
          });
        }
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (gameState === "scoreboard") {
      const timer = setTimeout(async () => {
        if (roundNumber >= maxRounds) {
          const winnerId = hostScore > guestScore ? matchRecord.host_id : hostScore < guestScore ? matchRecord.guest_id : null;
          const res = await advanceArenaState(matchRecord.id, "match_complete", { 
            winner_id: winnerId, 
            status: 'finished',
            host_answer: null,
            guest_answer: null
          });
          if (res?.serverTime) {
            clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
          }
          broadcastState("match_complete", { hostScore, guestScore });
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else {
          const res = await advanceArenaState(matchRecord.id, "next_round");
          if (res?.serverTime) {
            clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
          }
          broadcastState("next_round");
        }
      }, 4000);
      return () => clearTimeout(timer);
    }

    if (gameState === "next_round") {
      const timer = setTimeout(() => {
        startCountdown();
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (gameState === "countdown" || gameState === "generating_round") {
      // If we are host and got stuck here on reload, auto-trigger next question setup
      if (!isGeneratingRef.current) {
        isGeneratingRef.current = true;
        if (gameState !== "generating_round") {
          advanceArenaState(matchRecord.id, "generating_round").then((res) => {
            if (res?.serverTime) {
              clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
            }
            generateNextQuestion();
          });
        } else {
          generateNextQuestion();
        }
      }
    }
  }, [gameState, hostReady, guestReady, hostAnswer, guestAnswer, isHost, roundData, roundType, roundNumber, maxRounds, hostScore, guestScore, matchRecord]);

  // 4. Turn Countdown Timer (Autosubmits TIMEOUT if time expires)
  const [turnTimeLeft, setTurnTimeLeft] = useState<number | null>(null);
  
  useEffect(() => {
    const answered = isHost ? !!hostAnswer : !!guestAnswer;
    if (gameState !== "question" || timeLimit <= 0 || answered || !matchRecord?.round_expires_at) {
      setTurnTimeLeft(null);
      return;
    }

    const calculateRemaining = () => {
      const expiresAt = new Date(matchRecord.round_expires_at).getTime();
      const now = Date.now() + clockSkewRef.current;
      const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
      return Math.min(timeLimit, remaining);
    };

    setTurnTimeLeft(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTurnTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleAnswer("TIMEOUT");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLimit, isHost, hostAnswer, guestAnswer, matchRecord?.round_expires_at]);

  const startCountdown = async () => {
    isGeneratingRef.current = false; // Reset lock
    isRevealingRef.current = false; // Reset lock
    // Clear old question/answers to avoid rendering stale data during countdown/generating state!
    setQuestion(null);
    setRoundData(null);
    setHostAnswer(null);
    setGuestAnswer(null);

    const res = await advanceArenaState(matchRecord.id, "countdown");
    if (res?.serverTime) {
      clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
    }
    broadcastState("countdown", { countdown: 3 });
    
    let c = 3;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    countdownIntervalRef.current = setInterval(() => {
      c--;
      syncPartialState({ countdown: c });
      setCountdown(c);
      if (c <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        if (!isGeneratingRef.current) {
          isGeneratingRef.current = true;
          // Set to generating UI state while we fetch Groq API
          broadcastState("generating_round");
          advanceArenaState(matchRecord.id, "generating_round").then((advRes) => {
            if (advRes?.serverTime) {
              clockSkewRef.current = new Date(advRes.serverTime).getTime() - Date.now();
            }
            generateNextQuestion();
          });
        }
      }
    }, 1000);
  };

  const generateNextQuestion = async () => {
    const res = await generateNextArenaRound(matchRecord.id);
    if (!res || res.error || !res.round || !res.match) {
      console.error(res?.error || "Failed to generate round");
      toast.error(res?.error || "Failed to generate round. You can retry.");
      // Fallback: reset generator lock so it can be retried or debugged
      isGeneratingRef.current = false;
      return;
    }
    if (res.serverTime) {
      clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
    }
    setMatchRecord(res.match);

    setHostAnswer(null);
    setGuestAnswer(null);
    setQuestion(res.round.questionData);
    setRoundType(res.round.type);
    setRoundData(res.round.answerData);
    setRoundNumber(res.match.round_number);

    broadcastState("question", { 
      question: res.round.questionData, 
      roundType: res.round.type,
      roundData: res.round.answerData,
      roundNumber: res.match.round_number,
      roundExpiresAt: res.match.round_expires_at,
      hostAnswer: null, 
      guestAnswer: null 
    });
    
    isGeneratingRef.current = false;
  };

  function checkCorrectness(answer: any, correctAnswer: any, type: string) {
    if (!answer || answer === "TIMEOUT") return false;
    
    const ansLower = answer.toString().toLowerCase().trim();
    const correctLower = correctAnswer.toString().toLowerCase().trim();
    
    if (type === "MATCH_MEMORY") {
      return ansLower === correctLower;
    }

    if (type === "WHO_AM_I" || type === "MYSTERY_PLAYER" || type === "ARENA_QUIZ" || type === "CAREER_PATH_DUEL") {
      // Basic fuzzy matching for text inputs / choices
      if (ansLower.includes(correctLower) || correctLower.includes(ansLower)) return true;
      
      // Check aliases for player guessing games
      try {
        const mappings = require("@/lib/data/player-mappings.json");
        const mapped = mappings.find((m: any) => 
          m.cricsheet_name.toLowerCase() === correctLower || 
          m.display_name.toLowerCase() === correctLower
        );
        if (mapped && mapped.aliases) {
          return mapped.aliases.some((a: string) => a.toLowerCase() === ansLower || ansLower.includes(a.toLowerCase()));
        }
      } catch (e) {
        console.error("Alias check failed", e);
      }
      return false;
    }
    
    return answer === correctAnswer;
  };

  async function triggerAnswerReveal() {
    if (isRevealingRef.current) return;
    isRevealingRef.current = true;

    const correctAnswer = roundData?.answer;
    
    const hostCorrect = checkCorrectness(hostAnswer, correctAnswer, roundType);
    const guestCorrect = checkCorrectness(guestAnswer, correctAnswer, roundType);

    // Scoring system: +100 correct, -25 incorrect (0 if skipped or timed out)
    const getPoints = (ans: any, isCorrect: boolean) => {
      if (!ans || ans === "SKIPPED" || ans === "TIMEOUT") return 0;
      return isCorrect ? 100 : -25;
    };

    let newHostScore = hostScore + getPoints(hostAnswer, hostCorrect);
    let newGuestScore = guestScore + getPoints(guestAnswer, guestCorrect);

    setHostScore(newHostScore);
    setGuestScore(newGuestScore);

    const res = await advanceArenaState(matchRecord.id, "answer_reveal", {
      host_score: newHostScore,
      guest_score: newGuestScore
    });
    if (res?.serverTime) {
      clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
    }

    broadcastState("answer_reveal", { hostScore: newHostScore, guestScore: newGuestScore });
  };

  // Actions
  const toggleReady = async () => {
    if (isHost) {
      setHostReady(true);
      broadcastState(gameState, { hostReady: true });
      await updateMatchState(matchRecord.id, { host_answer: "READY" });
    } else {
      setGuestReady(true);
      broadcastState(gameState, { guestReady: true });
      await updateMatchState(matchRecord.id, { guest_answer: "READY" });
    }
  };

  const handleSkipRound = async () => {
    if (!isHost || gameState !== "question" || isRevealingRef.current || !matchRecord) return;
    
    // Set both answers to "SKIPPED" in database
    const res = await updateMatchState(matchRecord.id, {
      host_answer: "SKIPPED",
      guest_answer: "SKIPPED"
    });
    if (res?.serverTime) {
      clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
    }
    
    // Set locally so triggerAnswerReveal uses them
    setHostAnswer("SKIPPED");
    setGuestAnswer("SKIPPED");
    
    // Broadcast the skipped answers so guest clears their UI locks
    syncPartialState({ hostAnswer: "SKIPPED", guestAnswer: "SKIPPED" });
    
    // Wait a brief moment for state to settle, then reveal
    setTimeout(() => {
      triggerAnswerReveal();
    }, 100);
  };

  const handleAnswer = async (ans: any) => {
    if (!matchRecord) return;
    if (ans === "FAILED" || ans === "TIMEOUT") {
      if (isHost && !hostAnswer) {
        setHostAnswer(ans);
        syncPartialState({ hostAnswer: ans });
        const res = await updateMatchState(matchRecord.id, { host_answer: ans });
        if (res?.serverTime) {
          clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
        }
      } else if (!isHost && !guestAnswer) {
        setGuestAnswer(ans);
        syncPartialState({ guestAnswer: ans });
        const res = await updateMatchState(matchRecord.id, { guest_answer: ans });
        if (res?.serverTime) {
          clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
        }
      }
      return;
    }

    const isCorrect = checkCorrectness(ans, roundData.answer, roundType);

    if (isHost) {
      if (hostAnswer) return; 
      // If it's a multi-guess game, only lock in the correct answer or FAILED.
      // If it's a 1-guess game (like PLAYER_VS_PLAYER), lock it in regardless.
      if (isCorrect || roundType === "PLAYER_VS_PLAYER" || roundType === "STAT_SMASH") {
        setHostAnswer(ans);
        syncPartialState({ hostAnswer: ans });
        const res = await updateMatchState(matchRecord.id, { host_answer: ans });
        if (res?.serverTime) {
          clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
        }
      } else {
        // Send a wrong guess state (optional, just for opponent to see)
        syncPartialState({ latestHostGuess: ans });
      }
    } else {
      if (guestAnswer) return;
      if (isCorrect || roundType === "PLAYER_VS_PLAYER" || roundType === "STAT_SMASH") {
        setGuestAnswer(ans);
        syncPartialState({ guestAnswer: ans });
        const res = await updateMatchState(matchRecord.id, { guest_answer: ans });
        if (res?.serverTime) {
          clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
        }
      } else {
        syncPartialState({ latestGuestGuess: ans });
      }
    }
  };

  useEffect(() => {
    if (gameState === "ready" || gameState === "waiting") {
      isRevealingRef.current = false;
      isGeneratingRef.current = false;
    }
  }, [gameState]);

  const handleRequestRematch = async () => {
    if (!matchRecord) return;
    
    const res = await requestRematch(matchRecord.id, isHost);
    
    if (res?.error) {
      toast.error(res.error);
      return;
    }

    if (res?.serverTime) {
      clockSkewRef.current = new Date(res.serverTime).getTime() - Date.now();
    }

    // Set local ready state
    if (isHost) {
      setHostReady(true);
      broadcastState(gameState, { hostReady: true });
    } else {
      setGuestReady(true);
      broadcastState(gameState, { guestReady: true });
    }

    if (res?.reset) {
      toast.success("Rematch accepted! Starting new match...");
      
      // Broadcast the lobby reset to opponent
      broadcastState("ready", { 
        hostScore: 0, 
        guestScore: 0, 
        roundNumber: 1,
        hostReady: false,
        guestReady: false,
        question: null,
        roundData: null,
        hostAnswer: null,
        guestAnswer: null
      });
      
      // Update local states
      setGameState("ready");
      setHostScore(0);
      setGuestScore(0);
      setRoundNumber(1);
      setHostReady(false);
      setGuestReady(false);
      setQuestion(null);
      setRoundData(null);
      setHostAnswer(null);
      setGuestAnswer(null);
    } else {
      toast.success("Rematch request sent!");
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Settings Configuration Handler
  const handleUpdateSetting = async (field: string, value: any) => {
    if (!isHost || !matchRecord) return;

    let dbField = field;
    if (field === 'timeLimit') dbField = 'time_limit';
    if (field === 'gameFormat') dbField = 'game_format';
    if (field === 'maxRounds') dbField = 'max_rounds';

    // Update in State
    if (field === 'timeLimit') setTimeLimit(value);
    if (field === 'gameFormat') setGameFormat(value);
    if (field === 'difficulty') setDifficulty(value);
    if (field === 'maxRounds') setMaxRounds(value);

    // Broadcast to Guest
    syncPartialState({ [field]: value });

    // Save to Database
    await updateMatchState(matchRecord.id, { [dbField]: value });
  };

  // Chat message submission
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !matchRecord) return;

    const text = chatInput.trim();
    setChatInput("");

    // Save in Database
    const res = await sendArenaChatMessage(matchRecord.id, text);
    
    if (res.success && res.message) {
      // Broadcast to Opponent
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "chat_message",
          payload: { message: res.message }
        });
      }

      // Append locally
      setChatMessages(prev => [...prev, res.message]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      toast.error("Failed to send chat message.");
    }
  };

  const renderSettingsPanel = () => {
    const formatLabels: any = {
      mixed: "Mixed Formats (All Games)",
      guess_who: "Guess Who Only",
      stat_smash: "Stat Smash Only",
      guess_match: "Guess the Match Only",
      career_path: "Career Path Only",
      connections: "Connections Only",
      arena_quiz: "Arena Quiz Only"
    };

    if (isHost) {
      return (
        <div className="w-full max-w-xl mx-auto mt-8 p-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="font-extrabold text-sm text-[#0B2A96] uppercase tracking-wider outfit-bold flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Activity className="h-4 w-4 text-[#0B2A96]" />
            Match Settings (Host Console)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            
            {/* Game Format */}
            <CustomSelect
              label="Game Format"
              options={gameFormatOptions}
              value={gameFormat}
              onChange={(val) => handleUpdateSetting("gameFormat", val)}
            />

            {/* Turn Timer */}
            <CustomSelect
              label="Turn Timer"
              options={timeLimitOptions}
              value={timeLimit}
              onChange={(val) => handleUpdateSetting("timeLimit", val)}
            />

            {/* Max Rounds */}
            <CustomSelect
              label="Max Rounds"
              options={maxRoundsOptions}
              value={maxRounds}
              onChange={(val) => handleUpdateSetting("maxRounds", val)}
            />

            {/* Difficulty */}
            <CustomSelect
              label="Difficulty"
              options={difficultyOptions}
              value={difficulty}
              onChange={(val) => handleUpdateSetting("difficulty", val)}
            />

          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full max-w-xl mx-auto mt-8 p-6 bg-slate-50/50 border border-slate-200/80 rounded-3xl shadow-xs text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="font-extrabold text-sm text-[#0B2A96] uppercase tracking-wider outfit-bold flex items-center gap-1.5 border-b border-slate-200/50 pb-2.5">
            <Clock className="h-4.5 w-4.5 text-[#0B2A96]/70" />
            Match Settings (Configured by Host)
          </h3>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Format</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{formatLabels[gameFormat] || gameFormat}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Turn Timer</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{timeLimit > 0 ? `${timeLimit}s per turn` : "Unlimited"}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rounds</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{maxRounds} Rounds</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Difficulty</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5 capitalize">{difficulty}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold outfit-bold text-destructive mb-2">Connection Error</h2>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <button onClick={() => router.push('/dashboard/arena')} className="mt-8 px-6 py-2 bg-secondary/10 text-secondary rounded-lg font-bold">Return</button>
      </div>
    );
  }

  if (!matchRecord) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[80vh] w-full p-4 lg:p-8 max-w-7xl mx-auto gap-6 items-start">
      
      {/* LEFT COLUMN: Arena Gameplay */}
      <div className="flex-1 w-full flex flex-col items-center min-w-0">
        
        {/* Header / Scoreboard */}
        <div className="w-full flex justify-between items-center mb-8 bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-50 text-[#0B2A96] rounded-2xl flex items-center justify-center font-bold text-lg border border-blue-100 shadow-inner">
              {isHost ? hostScore : guestScore}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">You</p>
              <p className="font-extrabold text-sm text-slate-800 outfit-bold">{isHost ? hostUsername : guestUsername}</p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div 
              onClick={copyRoomCode}
              className="text-[10px] text-slate-500 font-mono bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full mb-1 flex items-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors shadow-2xs"
              title="Copy Room Code"
            >
              <span>ROOM: {roomId}</span>
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0B2A96] outfit-bold mt-1">
              Round {Math.min(roundNumber, maxRounds)} / {maxRounds}
            </p>
            <button 
              onClick={() => {
                setShowChat(!showChat);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }} 
              className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                showChat 
                  ? "bg-[#0B2A96] text-white border-[#0B2A96]" 
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>Lobby Chat</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Opponent</p>
              <p className="font-extrabold text-sm text-slate-800 outfit-bold">{!isHost ? hostUsername : guestUsername}</p>
            </div>
            <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-rose-100 shadow-inner">
              {!isHost ? hostScore : guestScore}
            </div>
          </div>
        </div>

        {/* Turn Timer Progress Bar */}
        {gameState === "question" && turnTimeLeft !== null && (
          <div className="w-full max-w-2xl mx-auto mb-6 flex items-center justify-between gap-4 bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-2xs animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="h-4.5 w-4.5 animate-pulse text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time Remaining</span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  turnTimeLeft <= 5 ? "bg-rose-500 animate-pulse" : "bg-[#0B2A96]"
                }`}
                style={{ width: `${(turnTimeLeft / timeLimit) * 100}%` }}
              />
            </div>
            
            <span className={`text-xs font-black outfit-bold ${turnTimeLeft <= 5 ? "text-rose-600 animate-bounce" : "text-slate-800"}`}>
              {turnTimeLeft}s
            </span>
          </div>
        )}

        {/* Main Game Area */}
        <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
          
          {gameState === "waiting" && (
            <div className="text-center animate-in fade-in duration-300 w-full">
              <Activity className="h-14 w-14 text-[#0B2A96] mx-auto mb-5 animate-pulse" />
              <h2 className="text-2xl font-black outfit-bold text-slate-800 mb-2">Waiting for Opponent</h2>
              <p className="text-xs text-slate-400 inter-medium max-w-sm mx-auto leading-relaxed">
                Invite a friend by sharing the unique room code above. The game will advance automatically when they join.
              </p>
              {renderSettingsPanel()}
            </div>
          )}

          {gameState === "ready" && (
            <div className="text-center animate-in zoom-in duration-500 w-full max-w-xl mx-auto p-8 bg-white border border-slate-200/80 rounded-3xl shadow-lg">
              <Swords className="h-16 w-16 text-[#0B2A96] mx-auto mb-5 animate-pulse" />
              <h2 className="text-3xl font-black outfit-bold text-slate-800 mb-2">Match Found!</h2>
              <p className="text-xs text-slate-400 mb-8 uppercase tracking-widest font-bold">Lobby ready check</p>
              
              {/* Ready Status Grid */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                <div className={`p-4 rounded-2xl border transition-all ${hostReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Host</p>
                  <p className="font-extrabold text-sm outfit-bold truncate mb-2">{hostUsername}</p>
                  <div className="flex justify-center">
                    {hostReady ? (
                      <span className="flex items-center gap-1 text-xs font-bold"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accepted</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold opacity-60"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deciding...</span>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border transition-all ${guestReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-1">Opponent</p>
                  <p className="font-extrabold text-sm outfit-bold truncate mb-2">{guestUsername}</p>
                  <div className="flex justify-center">
                    {guestReady ? (
                      <span className="flex items-center gap-1 text-xs font-bold"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accepted</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold opacity-60"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deciding...</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                {!(isHost ? hostReady : guestReady) && (
                  <button 
                    onClick={toggleReady}
                    className="w-full max-w-xs px-8 py-3.5 bg-[#0B2A96] hover:bg-[#0f3a63] text-white text-sm font-bold rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-900/10 active:scale-95"
                  >
                    Accept Match & Ready Up
                  </button>
                )}

                {(isHost ? hostReady : guestReady) && !(hostReady && guestReady) && (
                  <div className="flex flex-col items-center gap-2">
                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                      <Check className="h-3.5 w-3.5" /> You are Ready
                    </span>
                    <p className="text-xs text-slate-400 mt-2">Waiting for opponent to accept the match...</p>
                  </div>
                )}

                {hostReady && guestReady && (
                  isHost ? (
                    <button
                      onClick={startCountdown}
                      className="w-full max-w-xs px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black outfit-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-700/20 active:scale-95 animate-pulse"
                    >
                      Start First Round
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-2.5">
                      <span className="px-4 py-2 bg-[#0B2A96]/10 text-[#0B2A96] text-xs font-bold rounded-full flex items-center gap-2 shadow-sm animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> All Ready! Host is starting...
                      </span>
                    </div>
                  )
                )}
              </div>
              
              {renderSettingsPanel()}
            </div>
          )}

          {gameState === "countdown" && (
            <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-8xl font-black outfit-bold text-[#0B2A96] animate-pulse">{countdown}</h2>
            </div>
          )}

          {gameState === "generating_round" && (
            <div className="text-center animate-in fade-in duration-500 w-full flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20"></div>
                <Loader2 className="h-20 w-20 text-[#0B2A96] animate-spin relative z-10" />
              </div>
              <h2 className="text-2xl font-black outfit-bold text-slate-800 mt-6 mb-2">Preparing Challenge...</h2>
              <p className="text-xs text-slate-400 inter-medium animate-pulse mb-6">Setting up the next round.</p>
              
              {isHost && (
                <button 
                  onClick={() => {
                    isGeneratingRef.current = true;
                    toast.info("Retrying round setup...");
                    generateNextQuestion();
                  }}
                  className="mt-4 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Retry Loading
                </button>
              )}
            </div>
          )}

          {(gameState === "question" || gameState === "answer_reveal") && question && (
            <div className="w-full">
              {isHost && gameState === "question" && (
                <div className="flex justify-end w-full max-w-6xl mx-auto mb-4">
                  <button
                    onClick={handleSkipRound}
                    className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    Skip Round
                  </button>
                </div>
              )}
              <RoundRenderer 
                roundType={roundType}
                questionData={question}
                gameState={gameState}
                onAnswer={handleAnswer}
                disabled={isHost ? !!hostAnswer : !!guestAnswer}
                myAnswer={isHost ? hostAnswer : guestAnswer}
                correctAnswer={roundData?.answer}
                explanation={roundData?.explanation}
              />

              {gameState === "answer_reveal" && roundType !== "ARENA_QUIZ" && roundType !== "CONNECTIONS_RACE" && (
                 <div className="mt-10 w-full max-w-xl mx-auto p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm text-center animate-in slide-in-from-bottom-4 duration-300">
                    <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3">Correct Answer</h3>
                    <div className="text-2xl font-extrabold text-[#0B2A96] outfit-bold">
                      {roundData?.answer}
                    </div>
                 </div>
              )}
              
              <div className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest h-6">
                {gameState === "question" && (hostAnswer && guestAnswer ? "Revealing..." : "Waiting for other player...")}
              </div>
            </div>
          )}

          {gameState === "scoreboard" && (
            <div className="text-center animate-in zoom-in duration-300 w-full max-w-md mx-auto">
              <h2 className="text-3xl font-black outfit-bold text-slate-800 mb-8 border-b border-slate-100 pb-3">Scoreboard</h2>
              <div className="grid grid-cols-2 gap-6 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs">
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <p className="text-3xl font-extrabold text-[#0B2A96] outfit-bold">{isHost ? hostScore : guestScore}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">You</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                  <p className="text-3xl font-extrabold text-rose-600 outfit-bold">{!isHost ? hostScore : guestScore}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Opponent</p>
                </div>
              </div>
            </div>
          )}

          {gameState === "next_round" && (
            <div className="text-center animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black outfit-bold text-[#0B2A96] animate-pulse">Get Ready for Next Round...</h2>
            </div>
          )}

          {gameState === "match_complete" && (
            <div className="text-center animate-in zoom-in fade-in w-full max-w-md mx-auto p-8 bg-white border border-slate-200/80 rounded-3xl shadow-lg">
              <Trophy className="h-20 w-20 text-amber-500 fill-amber-500/10 mx-auto mb-6 animate-bounce" />
              
              <h2 className="text-4xl font-black outfit-bold text-slate-800 mb-3">
                {hostScore > guestScore && isHost ? "You Won!" : 
                 guestScore > hostScore && !isHost ? "You Won!" : 
                 hostScore === guestScore ? "Draw!" :
                 "You Lost!"}
              </h2>
              
              <p className="text-sm font-bold text-slate-500 mb-6 leading-normal">
                Final Scoreboard: <span className="font-extrabold text-slate-800">{isHost ? hostScore : guestScore}</span> vs <span className="font-extrabold text-slate-500">{isHost ? guestScore : hostScore}</span>
              </p>

              {/* Rematch Status Cards */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className={`p-3.5 rounded-2xl border transition-all ${hostReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="text-[9px] uppercase font-bold tracking-widest opacity-80 mb-0.5">Host</p>
                  <p className="font-bold text-xs truncate mb-1">{hostUsername}</p>
                  <div className="flex justify-center text-[11px] font-bold">
                    {hostReady ? (
                      <span className="text-emerald-600 flex items-center gap-0.5"><Check className="h-3.5 w-3.5" /> Wants Rematch</span>
                    ) : (
                      <span className="opacity-50">Undecided</span>
                    )}
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border transition-all ${guestReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <p className="text-[9px] uppercase font-bold tracking-widest opacity-80 mb-0.5">Opponent</p>
                  <p className="font-bold text-xs truncate mb-1">{guestUsername}</p>
                  <div className="flex justify-center text-[11px] font-bold">
                    {guestReady ? (
                      <span className="text-emerald-600 flex items-center gap-0.5"><Check className="h-3.5 w-3.5" /> Wants Rematch</span>
                    ) : (
                      <span className="opacity-50">Undecided</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {!(isHost ? hostReady : guestReady) ? (
                  <button 
                    onClick={handleRequestRematch}
                    className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black outfit-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-700/10 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Swords className="h-4 w-4" /> Request Rematch
                  </button>
                ) : (
                  <button 
                    disabled
                    className="w-full px-8 py-4 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-2xl transition-all opacity-85 flex items-center justify-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" /> Waiting for Opponent...
                  </button>
                )}

                <button 
                  onClick={() => router.push('/dashboard/arena')}
                  className="w-full px-8 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Return to Arena Lobby
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Slide-out Chat Column */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: 20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "340px" }}
            exit={{ opacity: 0, x: 20, width: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full lg:w-[340px] bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs h-[520px] flex flex-col shrink-0 overflow-hidden lg:sticky lg:top-24"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-extrabold text-xs text-[#0B2A96] uppercase tracking-widest outfit-bold flex items-center gap-1.5">
                <MessageSquare className="h-4.5 w-4.5" />
                Lobby Chat Log
              </h3>
              <button 
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <XCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Messages box */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 flex flex-col">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === myDbUserId;
                  const senderTeamName = msg.sender?.favorite_team;
                  const teamData = teamsDb.find(t => t.name === senderTeamName);
                  const teamLogo = teamData?.image_url;

                  return (
                    <div key={msg.id} className={`flex flex-col mb-4 ${isMe ? "items-end" : "items-start"} animate-in fade-in duration-205`}>
                      <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {teamLogo && (
                          <img src={teamLogo} alt="team" className="w-4 h-4 object-contain rounded-full" />
                        )}
                        <span className="text-[10px] font-bold text-slate-500">{msg.sender?.username || "Player"}</span>
                      </div>
                      <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isMe 
                          ? "bg-[#0B2A96] text-white rounded-tr-none font-medium" 
                          : "bg-slate-100 text-slate-700 rounded-tl-none font-medium"
                      }`}>
                        {msg.message_text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-450 text-xs py-10 space-y-2">
                  <MessageSquare className="h-7 w-7 text-slate-300 animate-pulse" />
                  <p className="inter-medium leading-relaxed max-w-[200px] text-slate-400">No chat messages yet. coordinate rules here!</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0B2A96]/50 focus:border-[#0B2A96] transition-all font-semibold text-slate-800"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-[#0B2A96] hover:bg-[#0f3a63] disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:cursor-default"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
