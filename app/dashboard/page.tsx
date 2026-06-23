"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Target, 
  Gamepad2, 
  MapPin, 
  Network, 
  Trophy, 
  Flame, 
  Zap, 
  Sparkles,
  ChevronRight,
  Play,
  Clock,
  Award,
  HelpCircle,
  Swords,
  Copy,
  Check,
  Loader2,
  Share2,
  CheckCircle2,
  ArrowRight,
  X
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { GameMockup } from "@/components/mockups/GameMockups";
import { createOrJoinMatch, getMatchHistory } from "@/app/actions/arena";
import { getFriendsList, sendDirectMessage } from "@/app/actions/social";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/ui/custom-select";

const gameFormatOptions = [
  { value: "mixed", label: "Mixed Formats (All Games)" },
  { value: "guess_who", label: "Guess Who Only" },
  { value: "stat_smash", label: "Stat Smash Only" },
  { value: "guess_match", label: "Guess the Match Only" },
  { value: "career_path", label: "Career Path Only" },
  { value: "connections", label: "Connections Only" },
  { value: "arena_quiz", label: "Arena Quiz Only (4-Choice)" },
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

export default function DashboardGamesPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  // Battle Arena Multiplayer States
  const [battleStep, setBattleStep] = useState<"configure" | "created">("configure");
  const [multiplayerTab, setMultiplayerTab] = useState<"host" | "join">("host");
  const [battleLoading, setBattleLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const [gameFormat, setGameFormat] = useState("mixed");
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxRounds, setMaxRounds] = useState(7);
  const [difficulty, setDifficulty] = useState("medium");

  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingActiveMatches, setLoadingActiveMatches] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      loadActiveMatches();
    }
  }, [isSignedIn]);

  const loadActiveMatches = async () => {
    setLoadingActiveMatches(true);
    try {
      const res = await getMatchHistory();
      if (res.success && res.matches) {
        const unfinished = res.matches.filter((m: any) => m.status !== 'finished');
        setActiveMatches(unfinished);
        setCurrentUserId(res.currentUserId || "");
      }
    } catch (err) {
      console.error("Failed to load active matches:", err);
    } finally {
      setLoadingActiveMatches(false);
    }
  };

  // Fetch friends list once the room is created
  useEffect(() => {
    if (selectedGameId === "battle-arena" && battleStep === "created") {
      loadFriends();
    }
  }, [battleStep, selectedGameId]);

  const loadFriends = async () => {
    setLoadingFriends(true);
    try {
      const res = await getFriendsList();
      if (res.success && res.friends) {
        setFriends(res.friends);
      } else {
        toast.error("Could not load friends list");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load friends");
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleCreateRoom = async () => {
    setBattleLoading(true);
    // Generate a random 6 character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const res = await createOrJoinMatch(code, {
        time_limit: timeLimit,
        game_format: gameFormat,
        difficulty: difficulty,
        max_rounds: maxRounds
      });

      if (res.error) {
        toast.error(res.error);
        setBattleLoading(false);
        return;
      }

      setCreatedCode(code);
      setBattleStep("created");
      toast.success("Multiplayer room hosted! Invite your friends below.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create match room");
    } finally {
      setBattleLoading(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length === 6) {
      router.push(`/dashboard/arena/${joinCode.toUpperCase()}`);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/dashboard/arena/${createdCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Match link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = async (friendId: string, friendUsername: string) => {
    const link = `${window.location.origin}/dashboard/arena/${createdCode}`;
    const formatLabels: any = {
      mixed: "Mixed Formats",
      guess_who: "Guess Who Only",
      stat_smash: "Stat Smash Only",
      guess_match: "Guess the Match Only",
      career_path: "Career Path Only",
      connections: "Connections Only",
      arena_quiz: "Arena Quiz Only"
    };

    const inviteText = `🎮 Let's play 1v1 Battle Arena!
🏆 Rules: ${formatLabels[gameFormat] || "Mixed"} | ${timeLimit === 0 ? "Unlimited" : timeLimit + "s"} per turn | ${maxRounds} Rounds | ${difficulty.toUpperCase()} difficulty.
👉 Join Match Room: ${link}`;

    try {
      const res = await sendDirectMessage(friendId, inviteText);
      if (res.success) {
        setInvitedIds((prev) => [...prev, friendId]);
        toast.success(`Invitation sent to ${friendUsername}!`);
      } else {
        toast.error("Failed to send message: " + res.error);
      }
    } catch (err: any) {
      toast.error("Failed to invite friend: " + err.message);
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  const games = [
    {
      id: "guess-who",
      title: "Guess Who",
      description: "Deduce the mystery IPL cricketer in 6 attempts using visual clues like batting/bowling style, nationality, and team history.",
      icon: Search,
      href: "/dashboard/games/guess-who",
      difficulty: "Easy",
      time: "2 mins",
      xp: "100 XP"
    },
    {
      id: "stat-smash",
      title: "Stat Smash",
      description: "Compare historic statistics of IPL legends. Guess if the target player's stats are higher or lower to build your streak.",
      icon: Target,
      href: "/dashboard/games/stat-smash",
      difficulty: "Medium",
      time: "3 mins",
      xp: "150 XP"
    },
    {
      id: "guess-match",
      title: "Guess the Match",
      description: "Analyze a partially redacted historic match sheet. Deduce the exact IPL clash based on wickets, runs, and partnerships.",
      icon: Gamepad2,
      href: "/dashboard/games/guess-match",
      difficulty: "Hard",
      time: "5 mins",
      xp: "250 XP"
    },
    {
      id: "career-path",
      title: "Career Path",
      description: "Reconstruct a player's franchise timeline chronologically from their debut season up to their current squad list.",
      icon: MapPin,
      href: "/dashboard/games/career-path",
      difficulty: "Medium",
      time: "4 mins",
      xp: "150 XP"
    },
    {
      id: "connections",
      title: "Connections",
      description: "Group a grid of 16 IPL stars into 4 distinct groups of 4 based on subtle shared associations, milestones, or team histories.",
      icon: Network,
      href: "/dashboard/games/connections",
      difficulty: "Expert",
      time: "5 mins",
      xp: "300 XP",
      isNew: true
    },
    {
      id: "arena-quiz",
      title: "Arena Quiz",
      description: "Tackle cricket trivia questions curated from real IPL match scenarios and records, categorised by Era and Difficulty.",
      icon: Trophy,
      href: "/dashboard/games/arena-quiz",
      difficulty: "Medium",
      time: "3 mins",
      xp: "200 XP",
      isNew: true
    },
    {
      id: "battle-arena",
      title: "Battle Arena (1v1)",
      description: "Challenge friends in real-time 1v1 IPL trivia matches. Customize turn timers, game formats, max rounds, and difficulty, then share room links or invite via direct chat.",
      icon: Swords,
      href: "/dashboard/arena",
      difficulty: "Dynamic",
      time: "Varies",
      xp: "XP + Rating",
      isNew: true,
      isMultiplayer: true
    }
  ];

  const activeGame = games.find(g => g.id === selectedGameId) || games[0];

  const renderGameGraphic = (gameId: string) => {
    switch (gameId) {
      case "guess-who":
        return (
          <div className="w-full h-48 bg-slate-900 rounded-xl flex items-center justify-center p-4 relative overflow-hidden border border-slate-800 shadow-inner">
            <div className="absolute inset-0 bg-radial-gradient from-blue-900/40 via-transparent to-transparent pointer-events-none" />
            <div className="flex gap-6 items-center">
              <div className="h-28 w-28 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg relative">
                <HelpCircle className="h-12 w-12 text-slate-500 animate-pulse" />
                <div className="absolute -bottom-1 bg-[#0B2A96] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  CLUE 1/6
                </div>
              </div>
              <div className="space-y-2 text-xs font-semibold text-slate-300">
                <div className="flex gap-2">
                  <span className="text-slate-500">Role:</span>
                  <span className="text-white">All-Rounder</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500">Batting:</span>
                  <span className="text-white">Right-Hand</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500">Franchises:</span>
                  <span className="text-blue-400">CSK, RPSG, RR</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "stat-smash":
        return (
          <div className="w-full h-48 bg-slate-900 rounded-xl flex flex-col justify-between p-4 border border-slate-800 shadow-inner">
            <div className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">Stat Battle: Who has more Runs?</div>
            <div className="flex justify-between items-center my-auto">
              <div className="text-center flex-1">
                <div className="text-sm font-bold text-white outfit-bold">Virat Kohli</div>
                <div className="text-xs text-slate-400">7,263 Runs</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden max-w-[120px] mx-auto">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center border border-white shadow-md mx-2 italic shrink-0">
                VS
              </div>
              <div className="text-center flex-1">
                <div className="text-sm font-bold text-white outfit-bold">AB de Villiers</div>
                <div className="text-xs text-slate-400">5,162 Runs</div>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden max-w-[120px] mx-auto">
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: "68%" }} />
                </div>
              </div>
            </div>
            <div className="text-center text-[10px] text-yellow-400 font-semibold">Streak: 3 Win</div>
          </div>
        );
      case "guess-match":
        return (
          <div className="w-full h-48 bg-slate-900 rounded-xl flex flex-col justify-between p-4 border border-slate-800 shadow-inner font-mono text-xs text-emerald-400 select-none">
            <div className="border-b border-slate-800 pb-1 flex justify-between text-slate-400">
              <span>IPL 2019 MATCH SHEET</span>
              <span className="text-yellow-400 font-bold">REDACTED</span>
            </div>
            <div className="space-y-1.5 my-auto py-2">
              <div className="flex justify-between">
                <span>TEAM A: MI</span>
                <span className="text-white">149/8 (20.0 Overs)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/50 pb-1">
                <span>TEAM B: CSK</span>
                <span className="text-white bg-slate-800 px-1 rounded select-none">???.? Overs</span>
              </div>
              <div className="text-slate-400 text-[10px] text-center pt-1">
                Clue: Final ball wicket triggers 1-run victory.
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-right">Difficulty: Hard</div>
          </div>
        );
      case "career-path":
        return (
          <div className="w-full h-48 bg-slate-900 rounded-xl flex flex-col justify-center p-4 border border-slate-800 shadow-inner">
            <div className="flex justify-between items-center w-full max-w-sm mx-auto relative px-2">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
              <div className="z-10 bg-slate-900 border-2 border-slate-700 h-10 w-10 rounded-full flex flex-col items-center justify-center shadow-md">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">2008</span>
                <span className="text-[10px] text-white font-bold">RCB</span>
              </div>
              <div className="z-10 bg-slate-900 border-2 border-slate-700 h-10 w-10 rounded-full flex flex-col items-center justify-center shadow-md">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">2011</span>
                <span className="text-[10px] text-white font-bold">PBKS</span>
              </div>
              <div className="z-10 bg-slate-900 border-2 border-blue-500 h-10 w-10 rounded-full flex flex-col items-center justify-center shadow-md ring-2 ring-blue-500/20">
                <span className="text-[9px] text-blue-400 uppercase font-semibold">2018</span>
                <span className="text-[10px] text-blue-300 font-extrabold animate-pulse">? ? ?</span>
              </div>
              <div className="z-10 bg-slate-900 border-2 border-slate-700 h-10 w-10 rounded-full flex flex-col items-center justify-center shadow-md">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">2022</span>
                <span className="text-[10px] text-white font-bold">GT</span>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-400 mt-4 font-semibold">Match the teams to reconstruct his career track.</div>
          </div>
        );
      case "connections":
        return (
          <div className="w-full h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between border border-slate-800 shadow-inner space-y-1 select-none">
            <div className="bg-[#f9df6d] text-black rounded px-3 py-1 flex flex-col justify-center text-[10px] font-bold shadow-xs">
              <div>IPL ORANGE CAP WINNERS</div>
              <div className="text-[9px] text-black/70 font-normal">Kohli • Gill • Rahul • Warner</div>
            </div>
            <div className="bg-[#a0c35a] text-black rounded px-3 py-1 flex flex-col justify-center text-[10px] font-bold shadow-xs">
              <div>IPL HAT-TRICK HOLDERS</div>
              <div className="text-[9px] text-black/70 font-normal">Rohit • Mishra • Patel • Chawla</div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="bg-slate-800 text-white rounded p-1 text-[8px] font-bold text-center border border-slate-700">MS Dhoni</div>
              <div className="bg-slate-800 text-white rounded p-1 text-[8px] font-bold text-center border border-slate-700">Rishabh Pant</div>
              <div className="bg-slate-800 text-white rounded p-1 text-[8px] font-bold text-center border border-slate-700">Dinesh Karthik</div>
              <div className="bg-slate-800 text-white rounded p-1 text-[8px] font-bold text-center border border-slate-700">Sanjju Samson</div>
            </div>
            <div className="text-center text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Solve connections by finding groups of 4.</div>
          </div>
        );
      case "arena-quiz":
        return (
          <div className="w-full h-48 bg-slate-900 rounded-xl p-4 flex flex-col justify-between border border-slate-800 shadow-inner text-xs text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="font-bold text-[10px] text-blue-400 uppercase tracking-wider">Question 4 of 10</span>
              <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-yellow-400 font-semibold">200 XP</span>
            </div>
            <div className="font-semibold text-white leading-relaxed my-2 line-clamp-2">
              Which captain holds the record for the most IPL wins with a single franchise?
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-slate-800 border border-slate-700/50 p-2 rounded text-left font-medium select-none truncate">
                A. Gautam Gambhir
              </div>
              <div className="bg-blue-600/20 border border-blue-500 text-blue-300 p-2 rounded text-left font-bold select-none truncate">
                B. MS Dhoni ✓
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-transparent">
      {/* Top Banner / Header */}
      <div className="w-full bg-[#0B2A96] py-8 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-arena.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2A96] to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white outfit-bold tracking-tight">Dashboard Lounge</h1>
            <p className="text-sm text-blue-200 mt-1 font-medium">Select a game below or host a 1v1 Battle Arena match.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex flex-col items-center shadow-lg">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Level</span>
              <span className="text-lg font-bold text-white">42</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex flex-col items-center shadow-lg">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Win Rate</span>
              <span className="text-lg font-bold text-white">68%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Battle Arena Console */}
        <div className="w-full lg:w-[450px] shrink-0">
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="bg-[#0B2A96] text-white p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
               <div className="absolute right-[-20px] top-[-20px] opacity-10">
                 <Swords className="h-32 w-32" />
               </div>
               <div className="relative z-10">
                 <h2 className="text-lg font-extrabold flex items-center gap-2 outfit-bold">
                   <Swords className="h-5 w-5" />
                   1v1 Battle Arena
                 </h2>
                 <p className="text-[11px] text-blue-200 font-medium mt-0.5">Real-time multiplayer challenge</p>
               </div>
               <Link href="/dashboard/arena/history" className="relative z-10 text-[10px] font-bold bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1.5 rounded-lg border border-white/20">
                 History 📊
               </Link>
            </div>
            
            <div className="p-5 flex-1 bg-slate-50 dark:bg-background/50">
              <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                <button
                  type="button"
                  onClick={() => setMultiplayerTab("host")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    multiplayerTab === "host"
                      ? "bg-white dark:bg-card text-[#0B2A96] dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  Host Match
                </button>
                <button
                  type="button"
                  onClick={() => setMultiplayerTab("join")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    multiplayerTab === "join"
                      ? "bg-white dark:bg-card text-[#0B2A96] dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  Join Match
                </button>
              </div>

              {/* Unfinished matches list */}
              {activeMatches.length > 0 && (
                <div className="mb-5 bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <h4 className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider outfit-bold">Unfinished Matches</h4>
                    </div>
                    <span className="text-[9px] text-blue-600 font-extrabold bg-blue-100/50 border border-blue-200/30 px-2 py-0.5 rounded-full">{activeMatches.length} pending</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {activeMatches.map((match) => {
                      const isHost = match.host_id === currentUserId;
                      const opponent = isHost
                        ? (match.guest?.username || "Guest (Waiting...)")
                        : (match.host?.username || "Host");
                      const formatLabel = gameFormatOptions.find(o => o.value === match.game_format)?.label || match.game_format;
                      return (
                        <div key={match.id} className="flex items-center justify-between bg-white border border-blue-100/80 rounded-lg p-2.5 shadow-sm gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                              <span className="text-[#0B2A96] font-extrabold truncate max-w-[100px]">vs {opponent}</span>
                              <span className="text-slate-400 font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Code: {match.room_code}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                              {formatLabel} • Rd {match.match_history?.length || 0}/{match.max_rounds}
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/arena/${match.room_code}`}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#0B2A96] hover:bg-[#0f3a63] text-white text-[9px] font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            Play
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {battleStep === "configure" ? (
                  <motion.div
                    key="configure"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {multiplayerTab === "host" ? (
                      <div className="space-y-4">
                        <CustomSelect
                          label="Game Format"
                          options={gameFormatOptions}
                          value={gameFormat}
                          onChange={(val) => setGameFormat(val)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <CustomSelect
                            label="Turn Timer"
                            options={timeLimitOptions}
                            value={timeLimit}
                            onChange={(val) => setTimeLimit(val)}
                          />
                          <CustomSelect
                            label="Difficulty"
                            options={difficultyOptions}
                            value={difficulty}
                            onChange={(val) => setDifficulty(val)}
                          />
                        </div>
                        <CustomSelect
                          label="Max Rounds"
                          options={maxRoundsOptions}
                          value={maxRounds}
                          onChange={(val) => setMaxRounds(val)}
                        />
                        <button
                          type="button"
                          onClick={handleCreateRoom}
                          disabled={battleLoading}
                          className="w-full mt-4 py-3.5 bg-[#0B2A96] hover:bg-[#0f3a63] text-white transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          {battleLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Hosting Room...</>
                          ) : (
                            <><Swords className="h-4 w-4" /> Host Match Room</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <p className="text-slate-500 text-xs text-center px-4 leading-relaxed font-medium">
                          Have an invite link or a 6-digit room code? Enter it below to join the match lobby instantly.
                        </p>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                          <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-Digit Code"
                            maxLength={6}
                            className="w-full h-14 bg-white border-2 border-slate-200 rounded-xl px-4 font-mono text-xl tracking-[0.2em] uppercase text-center focus:outline-none focus:ring-4 focus:ring-[#0B2A96]/20 focus:border-[#0B2A96] transition-all placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 placeholder:text-sm font-bold shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={joinCode.trim().length !== 6}
                            className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#d97706] text-white transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50 disabled:grayscale cursor-pointer"
                          >
                            Join Match <ArrowRight className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="created"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-4"
                  >
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold outfit-bold text-emerald-900">Room Created!</h3>
                        <p className="text-[10px] text-emerald-700 font-medium">Invite players or copy the room link.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Room Code</span>
                        <div className="text-2xl font-mono font-extrabold tracking-widest text-[#1E293B] mt-1">{createdCode}</div>
                      </div>
                      
                      <div className="flex flex-col justify-center pl-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Format</span>
                        <span className="text-xs font-extrabold text-[#0B2A96] mt-1 uppercase">
                          {gameFormat.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Share Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/dashboard/arena/${createdCode}`}
                          className="flex-1 h-10 bg-slate-100 border border-slate-200 rounded-xl px-3 text-[11px] font-semibold text-slate-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="h-10 w-12 bg-[#0B2A96] text-white rounded-xl flex items-center justify-center hover:bg-[#0f3a63] transition-colors shadow-sm"
                        >
                          {copied ? <Check className="h-4 w-4 animate-in zoom-in" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                       <h4 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                         <Share2 className="h-3 w-3 text-[#0B2A96]" />
                         Invite Friends via Chat
                       </h4>
                       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                         <div className="p-2 border-b border-slate-100 bg-slate-50">
                           <input
                             type="text"
                             placeholder="Search friends..."
                             value={friendSearchQuery}
                             onChange={(e) => setFriendSearchQuery(e.target.value)}
                             className="w-full h-8 bg-white border border-slate-200 rounded-lg px-3 text-[10px] focus:outline-none focus:border-[#0B2A96] transition-colors"
                           />
                         </div>
                         <div className="max-h-[150px] overflow-y-auto p-2 space-y-1 bg-white">
                            {loadingFriends ? (
                              <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#0B2A96]" />
                                <span className="text-[10px] font-semibold">Loading friends...</span>
                              </div>
                            ) : friends.length === 0 ? (
                              <div className="py-4 text-center">
                                <p className="text-slate-400 text-[10px] font-medium">No friends in list.</p>
                              </div>
                            ) : filteredFriends.length === 0 ? (
                              <div className="py-3 text-center text-slate-400 text-[10px] font-medium">No matches.</div>
                            ) : (
                              filteredFriends.map((friend: any) => {
                                const isInvited = invitedIds.includes(friend.id);
                                return (
                                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-md bg-[#0B2A96]/10 flex items-center justify-center font-bold text-[9px] text-[#0B2A96] uppercase">
                                        {friend.username.substring(0, 2)}
                                      </div>
                                      <div className="text-[11px] font-bold text-slate-700">{friend.username}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleInviteFriend(friend.id, friend.username)}
                                      disabled={isInvited}
                                      className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition-all ${
                                        isInvited 
                                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                          : "bg-[#0B2A96]/10 text-[#0B2A96] hover:bg-[#0B2A96]/20 cursor-pointer"
                                      }`}
                                    >
                                      {isInvited ? "Invited ✓" : "Invite"}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Game Cards Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold outfit-bold text-foreground">Featured Games</h2>
             <span className="text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
               Single Player
             </span>
          </div>
          {/* Grid Cards Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {games.filter((g: any) => !g.isMultiplayer).map((game: any) => {
              let imgSrc = "";
              switch (game.id) {
                case "guess-who": imgSrc = "/guess_the_player.jpeg"; break;
                case "stat-smash": imgSrc = "/stat_smash.png"; break;
                case "guess-match": imgSrc = "/guess_match.png"; break;
                case "career-path": imgSrc = "/career_journey.jpeg"; break;
                case "connections": imgSrc = "/connections.png"; break;
                case "arena-quiz": imgSrc = "/arena_quiz.png"; break;
                default: imgSrc = "/guess_the_player.jpeg";
              }

              return (
                <div 
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className="group relative h-[380px] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#0B2A96]/20 transition-all duration-500 hover:-translate-y-1.5 border border-[#0B2A96]/10 bg-slate-950"
                >
                  {/* Blurred Background Layer */}
                  <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 transition-transform duration-700 group-hover:scale-110" />
                  
                  {/* Sharp Contain Layer */}
                  <div className="absolute inset-0 p-2 pb-28 flex items-center justify-center pointer-events-none z-0">
                    <img src={imgSrc} className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:scale-[1.02]" />
                  </div>
                  
                  {/* Stronger Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none transition-all duration-500 group-hover:bg-slate-950/40" />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end pointer-events-none z-10">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {game.isNew && <span className="bg-emerald-500 text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">NEW</span>}
                      <span className="bg-[#0B2A96] text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest shadow-lg border border-white/10">{game.difficulty}</span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 group-hover:text-blue-200 transition-colors">{game.title}</h3>
                    <p className="text-xs font-medium text-slate-300 line-clamp-2 leading-relaxed mb-6 max-w-[280px]">{game.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/90 bg-white/10 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                          <Clock className="w-3 h-3" /> {game.time}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-400 bg-black/30 border border-yellow-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
                          <Award className="w-3 h-3" /> {game.xp}
                        </span>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white text-[#0B2A96] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Play className="w-4 h-4 fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Game Detail Modal */}
      {selectedGameId && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
          <div className="absolute inset-0" onClick={() => setSelectedGameId(null)} />
          {(() => {
            const game = games.find(g => g.id === selectedGameId) || games[0];
            const GameIcon = game.icon;
            return (
              <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative flex flex-col lg:flex-row animate-in zoom-in-95 duration-300 z-10">
                <button 
                  onClick={() => setSelectedGameId(null)}
                  className="absolute top-6 right-6 z-50 p-3 bg-white/50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors backdrop-blur-md cursor-pointer border border-slate-200 shadow-sm hover:scale-110"
                >
                  <ChevronRight className="h-6 w-6 rotate-180 hidden" />
                  <span className="text-xl font-bold">✕</span>
                </button>
                
                {/* Left Side: Game Details */}
                <div className="w-full lg:w-5/12 p-8 sm:p-14 bg-slate-50 border-r border-slate-200 flex flex-col">
                  <div className="h-20 w-20 rounded-[1.5rem] bg-[#0B2A96]/10 text-[#0B2A96] flex items-center justify-center mb-8 border border-[#0B2A96]/20 shadow-inner">
                    <GameIcon className="h-10 w-10" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {game.isNew && <span className="bg-emerald-500 text-white text-[10px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">NEW</span>}
                    <span className="bg-[#0B2A96]/10 text-[#0B2A96] text-[10px] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest border border-[#0B2A96]/20">{game.difficulty}</span>
                  </div>

                  <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">{game.title}</h2>
                  <p className="text-slate-600 text-lg leading-relaxed font-medium mb-12 flex-grow">
                    {game.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-12">
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-slate-50 rounded-xl"><Clock className="w-6 h-6 text-slate-500" /></div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Duration</div>
                        <div className="font-black text-slate-800 text-lg">{game.time}</div>
                      </div>
                    </div>
                    <div className="flex-1 bg-white border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                      <div className="p-3 bg-yellow-500/10 rounded-xl"><Award className="w-6 h-6 text-yellow-600" /></div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-yellow-600/70 tracking-widest mb-1">Reward</div>
                        <div className="font-black text-yellow-600 text-lg">{game.xp}</div>
                      </div>
                    </div>
                  </div>

                  {game.isMultiplayer ? (
                    <Link 
                      href={isSignedIn ? "/dashboard/arena" : "/login"}
                      className="w-full h-16 bg-[#0B2A96] hover:bg-[#082072] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(11,42,150,0.3)] hover:shadow-[0_15px_40px_rgba(11,42,150,0.4)] transition-all active:scale-[0.98]"
                    >
                      <Play className="h-5 w-5 fill-white" /> Host Match
                    </Link>
                  ) : (
                    <Link 
                      href={game.href}
                      className="w-full h-16 bg-[#0B2A96] hover:bg-[#082072] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(11,42,150,0.3)] hover:shadow-[0_15px_40px_rgba(11,42,150,0.4)] transition-all active:scale-[0.98]"
                    >
                      <Play className="h-5 w-5 fill-white" /> Play Now
                    </Link>
                  )}
                </div>

                {/* Right Side: Interactive UI Mockup */}
                <div className="w-full lg:w-7/12 bg-[#0B2A96]/5 p-6 sm:p-10 flex items-center justify-center relative overflow-hidden min-h-[500px]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0B2A96]/5 to-transparent pointer-events-none" />
                  <div className="w-full max-w-[400px] h-[650px] max-h-[85vh] relative z-10 flex items-center justify-center drop-shadow-2xl hover:scale-[1.02] transition-transform duration-500">
                    <GameMockup gameId={game.id} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
