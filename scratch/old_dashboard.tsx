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
  ArrowRight
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
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
  const [selectedGameId, setSelectedGameId] = useState("guess-who");

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
                <div className="absolute -bottom-1 bg-[#124B7E] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
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
    <div className="bg-[#F8FAFC] min-h-[90vh] text-[#1E293B] flex flex-col">

      {/* Interactive Master-Detail Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full flex flex-col space-y-6">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold outfit-bold text-[#124B7E]">Game Library</h2>
            <p className="text-xs text-slate-400 inter-regular mt-0.5">Select a game to view options and launch the challenge.</p>
          </div>
          <span className="text-[9px] font-bold bg-[#124B7E]/5 text-[#124B7E] px-2.5 py-1 rounded-lg border border-[#124B7E]/10 uppercase tracking-wide">
            Active Season
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Master List (Left Column) */}
          <div className="lg:col-span-5 space-y-3">
            {games.map((game) => {
              const GameIcon = game.icon;
              const isSelected = game.id === selectedGameId;

              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-center justify-between ${
                    isSelected 
                      ? "bg-white border-[#124B7E] shadow-sm text-foreground ring-2 ring-[#124B7E]/5" 
                      : "bg-white/60 border-slate-200/80 hover:border-slate-300 text-slate-600 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-xs border ${
                      isSelected 
                        ? "bg-[#124B7E] text-white border-transparent" 
                        : "bg-slate-50 text-slate-500 border-slate-100"
                    }`}>
                      <GameIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold outfit-bold text-sm flex items-center gap-2">
                        {game.title}
                        {game.isNew && (
                          <span className="bg-emerald-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium inter-regular">{game.time} • {game.xp}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                      {game.difficulty}
                    </span>
                    <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isSelected ? "translate-x-0.5 text-[#124B7E]" : ""}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Details Pane (Right Column) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs min-h-[460px] relative overflow-hidden">
              {/* Highlight ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#124B7E]" />
              
              {selectedGameId === "battle-arena" ? (
                // 1V1 MULTIPLAYER CONSOLE
                <AnimatePresence mode="wait">
                  {battleStep === "configure" ? (
                    <motion.div
                      key="configure"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 flex-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header & Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h3 className="text-xl font-bold outfit-bold text-[#124B7E]">Battle Arena (1v1)</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">Real-time multiplayer challenge</span>
                              <span className="text-slate-300">•</span>
                              <Link 
                                href="/dashboard/arena/history"
                                className="text-xs text-[#124B7E] hover:underline font-bold flex items-center gap-1"
                              >
                                Match History 📊
                              </Link>
                            </div>
                          </div>
                          
                          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => setMultiplayerTab("host")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                multiplayerTab === "host"
                                  ? "bg-white text-[#124B7E] shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Host Match
                            </button>
                            <button
                              type="button"
                              onClick={() => setMultiplayerTab("join")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                multiplayerTab === "join"
                                  ? "bg-white text-[#124B7E] shadow-xs"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Join Match
                            </button>
                          </div>
                        </div>

                        {/* Unfinished matches list */}
                        {activeMatches.length > 0 && (
                          <div className="mt-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4.5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider outfit-bold">Unfinished Matches</h4>
                              </div>
                              <span className="text-[10px] text-amber-600 font-extrabold bg-amber-100/50 border border-amber-250/30 px-2 py-0.5 rounded-full">{activeMatches.length} pending</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                              {activeMatches.map((match) => {
                                const isHost = match.host_id === currentUserId;
                                const opponent = isHost
                                  ? (match.guest?.username || "Guest (Waiting...)")
                                  : (match.host?.username || "Host");
                                const formatLabel = gameFormatOptions.find(o => o.value === match.game_format)?.label || match.game_format;
                                return (
                                  <div key={match.id} className="flex items-center justify-between bg-white border border-amber-100/80 rounded-xl p-3 shadow-2xs gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <span className="text-[#124B7E] font-extrabold">vs {opponent}</span>
                                        <span className="text-slate-350 font-normal">|</span>
                                        <span className="text-slate-400 font-mono text-[10px] bg-slate-100/80 px-1 py-0.5 rounded">Code: {match.room_code}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-semibold truncate mt-1">
                                        {formatLabel} • {match.difficulty.toUpperCase()} • Rd {match.match_history?.length || 0}/{match.max_rounds}
                                      </div>
                                    </div>
                                    <Link
                                      href={`/dashboard/arena/${match.room_code}`}
                                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white text-[10px] font-bold rounded-lg transition-all shadow-xs shrink-0 cursor-pointer animate-pulse-slow"
                                    >
                                      <Play className="h-2.5 w-2.5 fill-current" />
                                      Continue Match
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {multiplayerTab === "host" ? (
                          <div className="space-y-5 mt-4">
                            {/* Game Format */}
                            <CustomSelect
                              label="Game Format"
                              options={gameFormatOptions}
                              value={gameFormat}
                              onChange={(val) => setGameFormat(val)}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              {/* Turn Timer */}
                              <CustomSelect
                                label="Turn Timer"
                                options={timeLimitOptions}
                                value={timeLimit}
                                onChange={(val) => setTimeLimit(val)}
                              />

                              {/* Max Rounds */}
                              <CustomSelect
                                label="Max Rounds"
                                options={maxRoundsOptions}
                                value={maxRounds}
                                onChange={(val) => setMaxRounds(val)}
                              />

                              {/* Difficulty */}
                              <CustomSelect
                                label="Difficulty"
                                options={difficultyOptions}
                                value={difficulty}
                                onChange={(val) => setDifficulty(val)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5 mt-4">
                            <p className="text-slate-500 text-xs leading-relaxed">
                              Have an invite link or a 6-digit room code? Enter it below to join the match lobby.
                            </p>
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                              <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Enter 6-Digit Code"
                                maxLength={6}
                                className="w-full h-12 bg-slate-50 border border-slate-200/80 rounded-xl px-4 font-mono text-lg tracking-[0.2em] uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#124B7E]/30 focus:border-[#124B7E] transition-all placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 placeholder:text-xs font-semibold"
                              />
                            </form>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                        {multiplayerTab === "host" ? (
                          <button
                            type="button"
                            onClick={handleCreateRoom}
                            disabled={battleLoading}
                            className="px-8 py-3.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white transition-all rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                          >
                            {battleLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Hosting...
                              </>
                            ) : (
                              <>
                                <Swords className="h-4 w-4" /> Host Match
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleJoinRoom}
                            disabled={joinCode.trim().length !== 6}
                            className="px-8 py-3.5 bg-[#F59E0B] hover:bg-[#d97706] text-white transition-all rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                          >
                            Join Match <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="created"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-4 flex-1 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          <div>
                            <h3 className="text-base font-bold outfit-bold text-[#1E293B]">Multiplayer Room Created!</h3>
                            <p className="text-[10px] text-slate-400">Invite players or copy the room link below.</p>
                          </div>
                        </div>

                        {/* Room Code Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Room Code</span>
                            <div className="text-xl font-mono font-extrabold tracking-widest text-[#1E293B] mt-0.5">{createdCode}</div>
                          </div>
                          
                          <div className="flex flex-col justify-center text-left">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Format</span>
                            <span className="text-xs font-bold text-[#124B7E] mt-0.5 uppercase">
                              {gameFormat.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* Link Sharing */}
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Share Link</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/dashboard/arena/${createdCode}`}
                              className="flex-1 h-9 bg-slate-50 border border-slate-200/80 rounded-xl px-3 text-[10px] font-semibold text-slate-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="h-9 w-9 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-green-500 animate-in zoom-in duration-200" />
                              ) : (
                                <Copy className="h-4 w-4 text-slate-500" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Direct DM Invites */}
                        <div className="border-t border-slate-100 pt-3 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-[10px] text-[#1E293B] uppercase tracking-wider flex items-center gap-1">
                              <Share2 className="h-3 w-3 text-[#124B7E]" />
                              Invite via Chat
                            </h4>
                            {friends.length > 0 && (
                              <input
                                type="text"
                                placeholder="Search..."
                                value={friendSearchQuery}
                                onChange={(e) => setFriendSearchQuery(e.target.value)}
                                className="h-6 w-28 bg-slate-50 border border-slate-200/60 rounded-lg px-2 text-[9px] focus:outline-none"
                              />
                            )}
                          </div>

                          {loadingFriends ? (
                            <div className="flex items-center justify-center py-3 text-slate-400 gap-1.5">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#124B7E]" />
                              <span className="text-[9px] font-semibold">Loading friends...</span>
                            </div>
                          ) : friends.length === 0 ? (
                            <div className="py-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                              <p className="text-slate-400 text-[9px] font-medium">No friends in list.</p>
                            </div>
                          ) : filteredFriends.length === 0 ? (
                            <div className="py-2 text-center text-slate-400 text-[9px]">No matches.</div>
                          ) : (
                            <div className="max-h-24 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
                              {filteredFriends.map((friend: any) => {
                                const isInvited = invitedIds.includes(friend.id);
                                return (
                                  <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-5 w-5 rounded bg-[#124B7E]/10 flex items-center justify-center font-bold text-[8px] text-[#124B7E] uppercase">
                                        {friend.username.substring(0, 2)}
                                      </div>
                                      <div className="text-[10px] font-bold text-slate-700">{friend.username}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleInviteFriend(friend.id, friend.username)}
                                      disabled={isInvited}
                                      className={`h-6 px-2 rounded-md text-[9px] font-bold transition-all flex items-center gap-1 ${
                                        isInvited
                                          ? "bg-green-50 text-green-600 border border-green-200"
                                          : "bg-[#124B7E] text-white hover:bg-[#124B7E]/90 active:scale-[0.97]"
                                      }`}
                                    >
                                      {isInvited ? (
                                        <>
                                          <Check className="h-2 w-2" /> Invited
                                        </>
                                      ) : (
                                        "Invite"
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTAs */}
                      <div className="pt-4 border-t border-slate-100 flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setBattleStep("configure")}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-colors"
                        >
                          Back to Config
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/arena/${createdCode}`)}
                          className="px-5 py-2.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white text-[10px] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          Enter Arena Room <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : (
                // STANDARD DETAILS BLOCK
                <div className="space-y-6">
                  {/* Details Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-bold outfit-bold text-[#124B7E]">{activeGame.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Game Arena Details</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{activeGame.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 font-medium">
                        <Award className="h-3.5 w-3.5" />
                        <span className="text-amber-800 font-semibold">{activeGame.xp} Reward</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Dynamic Visual Graphic */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visual Preview</div>
                    {renderGameGraphic(activeGame.id)}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">About the Game</div>
                    <p className="text-[#1E293B] text-sm leading-relaxed inter-regular bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {activeGame.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="pt-8 border-t border-slate-100 mt-6 flex items-center justify-end">
                    <Link 
                      href={isSignedIn ? activeGame.href : "/login"} 
                      className="px-8 py-3.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white transition-colors duration-150 rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-white text-white" />
                      <span className="text-sm font-semibold">Enter Arena</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
