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
  Play, 
  Clock, 
  Award, 
  Swords, 
  Copy, 
  Check, 
  Loader2, 
  Share2, 
  CheckCircle2, 
  ArrowRight,
  Settings
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
  { value: "arena_quiz", label: "Arena Quiz Only" },
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

  // Selected Game ID for Modal details
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Lobby Code & Host states
  const [battleStep, setBattleStep] = useState<"configure" | "created">("configure");
  const [showHostSettings, setShowHostSettings] = useState(false);
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

  useEffect(() => {
    if (battleStep === "created") {
      loadFriends();
    }
  }, [battleStep]);

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
      toast.success("Match room hosted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create room");
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
    toast.success("Room link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteFriend = async (friendId: string, friendUsername: string) => {
    const link = `${window.location.origin}/dashboard/arena/${createdCode}`;
    const inviteText = `🎮 Let's play 1v1 Battle Arena!\n👉 Join Room: ${link}`;

    try {
      const res = await sendDirectMessage(friendId, inviteText);
      if (res.success) {
        setInvitedIds((prev) => [...prev, friendId]);
        toast.success(`Invite sent to ${friendUsername}!`);
      } else {
        toast.error("Failed to send invite: " + res.error);
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
      description: "Deduce the mystery IPL cricketer using visual clues, style, and team history.",
      icon: Search,
      href: "/dashboard/games/guess-who",
      difficulty: "Easy",
      time: "2 mins",
      xp: "100 XP"
    },
    {
      id: "stat-smash",
      title: "Stat Smash",
      description: "Compare player statistics and guess if the target player's stats are higher or lower.",
      icon: Target,
      href: "/dashboard/games/stat-smash",
      difficulty: "Medium",
      time: "3 mins",
      xp: "150 XP"
    },
    {
      id: "guess-match",
      title: "Guess the Match",
      description: "Analyze a partially redacted match sheet and identify the exact IPL clash.",
      icon: Gamepad2,
      href: "/dashboard/games/guess-match",
      difficulty: "Hard",
      time: "5 mins",
      xp: "250 XP"
    },
    {
      id: "career-path",
      title: "Career Path",
      description: "Reconstruct a player's franchise timeline chronologically from their debut season.",
      icon: MapPin,
      href: "/dashboard/games/career-path",
      difficulty: "Medium",
      time: "4 mins",
      xp: "150 XP"
    },
    {
      id: "connections",
      title: "Connections",
      description: "Group a grid of 16 IPL players into 4 distinct groups based on shared associations.",
      icon: Network,
      href: "/dashboard/games/connections",
      difficulty: "Expert",
      time: "5 mins",
      xp: "300 XP"
    },
    {
      id: "arena-quiz",
      title: "Arena Quiz",
      description: "Tackle cricket trivia questions curated from real IPL match scenarios and records.",
      icon: Trophy,
      href: "/dashboard/games/arena-quiz",
      difficulty: "Medium",
      time: "3 mins",
      xp: "200 XP"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Sleek Blue Lobby Header */}
      <div className="w-full bg-[#0B2A96] py-8 px-4 sm:px-6 lg:px-8 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2A96] to-blue-800"></div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight outfit-bold uppercase">Lobby Lounge</h1>
            <p className="text-xs text-blue-200 mt-1 font-medium">Host custom rooms, enter codes to deploy, and choose single player playlists.</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider">
              1v1 Battle Ready
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col gap-8">
        
        {/* TOP HIGHLIGHT SECTION: Full-Width Matchmaking Console */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="h-10 w-10 rounded bg-[#0B2A96]/10 flex items-center justify-center">
              <Swords className="h-5.5 w-5.5 text-[#0B2A96]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider outfit-bold">Battle Arena Deploy Console</h2>
              <p className="text-xs text-slate-500 font-medium">Enter a lobby code to join a match directly, or host your own custom room.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left Side: Enter Code to Join */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Join Lobby Code</h3>
              <form onSubmit={handleJoinRoom} className="space-y-3">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ENTER LOBBY CODE"
                  maxLength={6}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-lg px-4 font-mono text-lg tracking-[0.22em] uppercase text-center focus:outline-none focus:border-[#0B2A96] focus:ring-1 focus:ring-[#0B2A96] text-slate-800 placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 placeholder:text-xs font-bold transition-all"
                />
                <button
                  type="submit"
                  disabled={joinCode.trim().length !== 6}
                  className="w-full h-12 bg-[#0B2A96] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  Ready Up / Join Match <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Right Side: Host Custom Match */}
            <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-8">
              <AnimatePresence mode="wait">
                {battleStep === "configure" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Host Party</h3>
                      <button
                        onClick={() => setShowHostSettings(!showHostSettings)}
                        className="text-xs text-[#0B2A96] hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className={`h-3.5 w-3.5 ${showHostSettings ? 'rotate-45' : ''} transition-transform`} />
                        {showHostSettings ? "Hide Options" : "Room Options"}
                      </button>
                    </div>

                    {showHostSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1"
                      >
                        <div className="sm:col-span-2">
                          <CustomSelect
                            label="Game Format"
                            options={gameFormatOptions}
                            value={gameFormat}
                            onChange={(val) => setGameFormat(val)}
                          />
                        </div>
                        <CustomSelect
                          label="Turn Timer"
                          options={timeLimitOptions}
                          value={timeLimit}
                          onChange={(val) => setTimeLimit(val)}
                        />
                        <CustomSelect
                          label="Max Rounds"
                          options={maxRoundsOptions}
                          value={maxRounds}
                          onChange={(val) => setMaxRounds(val)}
                        />
                      </motion.div>
                    )}

                    <button
                      onClick={handleCreateRoom}
                      disabled={battleLoading}
                      className="w-full py-3 bg-white border border-[#0B2A96] text-[#0B2A96] hover:bg-[#0B2A96]/5 font-bold text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {battleLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> HOSTING...</>
                      ) : (
                        <><Swords className="h-3.5 w-3.5" /> Host Lobby Room</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">ROOM READY</h5>
                        <span className="text-sm font-mono font-bold text-slate-700 tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                          {createdCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyLink}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-250 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        Copy Link
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/arena/${createdCode}`)}
                        className="flex-1 py-2.5 bg-[#0B2A96] hover:bg-blue-800 text-white text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        Enter Arena <Play className="h-3 w-3 fill-current ml-0.5" />
                      </button>
                    </div>
                    
                    {/* Friends list invites */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden mt-1">
                      <div className="p-1.5 border-b border-slate-200 bg-white">
                        <input
                          type="text"
                          placeholder="Search friends to invite..."
                          value={friendSearchQuery}
                          onChange={(e) => setFriendSearchQuery(e.target.value)}
                          className="w-full h-8 bg-slate-50 border border-slate-250 rounded px-2.5 text-[10px] focus:outline-none focus:border-[#0B2A96] text-slate-800 transition-colors"
                        />
                      </div>
                      <div className="max-h-[90px] overflow-y-auto p-1.5 space-y-1 scrollbar-thin bg-slate-50">
                        {loadingFriends ? (
                          <div className="flex items-center justify-center py-2 text-slate-400 gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin text-[#0B2A96]" />
                            <span className="text-[8px] font-bold">LOADING...</span>
                          </div>
                        ) : friends.length === 0 ? (
                          <p className="text-[9px] text-slate-400 text-center py-1.5">No friends added.</p>
                        ) : filteredFriends.length === 0 ? (
                          <p className="text-[9px] text-slate-400 text-center py-1.5">No matches.</p>
                        ) : (
                          filteredFriends.map((friend: any) => {
                            const isInvited = invitedIds.includes(friend.id);
                            return (
                              <div key={friend.id} className="flex items-center justify-between p-1.5 rounded hover:bg-white border border-transparent transition-colors">
                                <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px]">{friend.username}</span>
                                <button
                                  type="button"
                                  onClick={() => handleInviteFriend(friend.id, friend.username)}
                                  disabled={isInvited}
                                  className={`px-2.5 py-1 text-[9px] font-extrabold rounded transition-all uppercase tracking-wider ${
                                    isInvited 
                                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                      : "bg-[#0B2A96] hover:bg-blue-800 text-white cursor-pointer"
                                  }`}
                                >
                                  {isInvited ? "Sent ✓" : "Invite"}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setBattleStep("configure")}
                      className="w-full py-1.5 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-[10px] font-bold uppercase rounded transition-all cursor-pointer"
                    >
                      Back to Config
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

        {/* MIDDLE SECTION: Resumable Ongoing Skirmishes */}
        {activeMatches.length > 0 && (
          <div className="bg-[#F0F4FF] border border-blue-200/50 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B2A96]"></span>
                </span>
                <h4 className="text-xs font-bold text-[#0B2A96] uppercase tracking-wider outfit-bold">PENDING SKIRMISHES</h4>
              </div>
              <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">{activeMatches.length} pending</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
              {activeMatches.map((match) => {
                const isHost = match.host_id === currentUserId;
                const opponent = isHost ? (match.guest?.username || "Guest (Waiting...)") : (match.host?.username || "Host");
                const formatLabel = gameFormatOptions.find(o => o.value === match.game_format)?.label || match.game_format;
                return (
                  <div key={match.id} className="flex items-center justify-between bg-white border border-blue-100 rounded-lg p-3 shadow-xs">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="text-[#0B2A96] truncate max-w-[140px]">vs {opponent}</span>
                        <span className="text-slate-400 font-mono text-[9px] bg-slate-50 border border-slate-200 px-1 py-0.5 rounded">Code: {match.room_code}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate mt-1">
                        {formatLabel} • Rd {match.match_history?.length || 0}/{match.max_rounds}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/arena/${match.room_code}`}
                      className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 bg-[#0B2A96] hover:bg-blue-800 text-white text-[10px] font-bold rounded transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      PLAY
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM SECTION: Playlists (High-Fidelity Cards Grid) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wider outfit-bold">Featured Playlists</h2>
            <span className="text-[10px] font-black tracking-widest bg-blue-100 text-[#0B2A96] border border-blue-200 px-3 py-1 rounded">
              SINGLE PLAYER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => {
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
                  className="group relative h-[360px] rounded-[1.5rem] overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:shadow-[#0B2A96]/10 transition-all duration-300 hover:-translate-y-1 border border-[#0B2A96]/10 bg-slate-950"
                >
                  {/* Blurred Background Image Layer */}
                  <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 transition-transform duration-500 group-hover:scale-105" />
                  
                  {/* Sharp Contain Mockup Image Layer */}
                  <div className="absolute inset-0 p-4 pb-24 flex items-center justify-center pointer-events-none z-0">
                    <img src={imgSrc} className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-[1.01]" />
                  </div>
                  
                  {/* Dark Gradient Overlay for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none z-10" />
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-end pointer-events-none z-20">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="bg-[#0B2A96] text-white text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-widest shadow-lg border border-white/10">{game.difficulty}</span>
                    </div>
                    
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1 group-hover:text-blue-200 transition-colors outfit-bold">{game.title}</h3>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed mb-4 max-w-[280px]">{game.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-white bg-slate-900/90 border border-slate-700/60 px-2.5 py-1 rounded-full backdrop-blur-md">
                          <Clock className="w-3.5 h-3.5" /> {game.time}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-yellow-400 bg-yellow-950/80 border border-yellow-500/30 px-2.5 py-1 rounded-full backdrop-blur-md">
                          <Award className="w-3.5 h-3.5" /> {game.xp}
                        </span>
                      </div>
                      <div className="h-9 w-9 rounded-full bg-white text-[#0B2A96] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xl">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
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
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
          <div className="absolute inset-0" onClick={() => setSelectedGameId(null)} />
          {(() => {
            const game = games.find(g => g.id === selectedGameId) || games[0];
            const GameIcon = game.icon;

            return (
              <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl relative flex flex-col lg:flex-row animate-in zoom-in-95 duration-200 z-10 text-slate-800 border border-slate-200">
                <button 
                  onClick={() => setSelectedGameId(null)}
                  className="absolute top-4 right-4 z-50 p-2.5 bg-slate-100 hover:bg-slate-250 rounded-lg text-slate-500 transition-all border border-slate-200 cursor-pointer"
                >
                  <span className="text-lg font-bold">✕</span>
                </button>
                
                {/* Left Side: Game Details */}
                <div className="w-full lg:w-5/12 p-8 sm:p-10 bg-slate-50 border-r border-slate-200 flex flex-col">
                  <div className="h-16 w-16 rounded-xl bg-[#0B2A96]/10 text-[#0B2A96] flex items-center justify-center mb-6 border border-[#0B2A96]/20 shadow-inner">
                    <GameIcon className="h-8 w-8" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-[#0B2A96] text-white text-[9px] px-2.5 py-1 rounded font-black uppercase tracking-widest border border-[#0B2A96]/10">{game.difficulty}</span>
                  </div>

                  <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight outfit-bold uppercase">{game.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed font-semibold mb-8 flex-grow">
                    {game.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-grow bg-white border border-slate-200 rounded p-4 flex items-center gap-3 shadow-xs">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200"><Clock className="w-5 h-5 text-slate-500" /></div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Duration</div>
                        <div className="font-extrabold text-slate-800 text-base">{game.time}</div>
                      </div>
                    </div>
                    <div className="flex-grow bg-white border border-slate-200 rounded p-4 flex items-center gap-3 shadow-xs">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200"><Award className="w-5 h-5 text-yellow-600" /></div>
                      <div>
                        <div className="text-[9px] uppercase font-bold text-yellow-600/70 tracking-widest">Reward</div>
                        <div className="font-extrabold text-yellow-600 text-base">{game.xp}</div>
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={game.href}
                    className="w-full py-4 bg-[#0B2A96] hover:bg-blue-800 text-white rounded font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                  >
                    <Play className="h-4.5 w-4.5 fill-current" /> PLAY NOW
                  </Link>
                </div>

                {/* Right Side: Interactive UI Mockup */}
                <div className="w-full lg:w-7/12 bg-slate-100 p-6 sm:p-8 flex items-center justify-center relative overflow-hidden min-h-[450px]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/5 to-transparent pointer-events-none" />
                  <div className="w-full max-w-[340px] h-[550px] relative z-10 flex items-center justify-center drop-shadow-2xl hover:scale-[1.01] transition-transform duration-350">
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
