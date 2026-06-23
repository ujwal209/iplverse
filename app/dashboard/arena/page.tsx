"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Swords, 
  Users, 
  Plus, 
  ArrowRight, 
  Copy, 
  Check, 
  Loader2, 
  Share2, 
  Settings, 
  Trophy, 
  Activity,
  Search,
  CheckCircle2
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { createOrJoinMatch } from "@/app/actions/arena";
import { getFriendsList, sendDirectMessage } from "@/app/actions/social";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CustomSelect } from "@/components/ui/custom-select";

const gameFormatOptions = [
  { value: "mixed", label: "Mixed Formats (All Games)" },
  { value: "guess_who", label: "Guess Who" },
  { value: "stat_smash", label: "Stat Smash" },
  { value: "guess_match", label: "Guess the Match" },
  { value: "career_path", label: "Career Path" },
  { value: "connections", label: "Connections" },
  { value: "arena_quiz", label: "Arena Quiz (4-Choice)" },
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

export default function BattleArenaLobby() {
  const router = useRouter();
  const { user } = useUser();
  
  // Navigation & step states
  const [step, setStep] = useState<"configure" | "created">("configure");
  const [loading, setLoading] = useState(false);
  
  // Join Room variables
  const [joinCode, setJoinCode] = useState("");

  // Create Room Settings
  const [gameFormat, setGameFormat] = useState("mixed");
  const [timeLimit, setTimeLimit] = useState(30);
  const [maxRounds, setMaxRounds] = useState(7);
  const [difficulty, setDifficulty] = useState("medium");
  
  // Created room results
  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Invite states
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // Fetch friends list once the room is created
  useEffect(() => {
    if (step === "created") {
      loadFriends();
    }
  }, [step]);

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
    setLoading(true);
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
        setLoading(false);
        return;
      }

      setCreatedCode(code);
      setStep("created");
      toast.success("Room created with custom configurations!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create match room");
    } finally {
      setLoading(false);
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
    toast.success("Shareable match link copied!");
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full p-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-20 w-20 bg-primary/10 text-primary rounded-3xl mb-6 shadow-sm border border-primary/20">
          <Swords className="h-10 w-10 text-[#0B2A96]" />
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black outfit-bold tracking-tight mb-4 text-[#1E293B]">
          Battle Arena
        </h1>
        <p className="text-md sm:text-lg text-slate-500 inter-medium max-w-xl mx-auto">
          Challenge friends in real-time 1v1 IPL trivia matches. Customize match rules, share room links, and compete for points.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "configure" ? (
          <motion.div 
            key="configure"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
          >
            {/* Create Room Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between group hover:border-[#0B2A96]/40 transition-all duration-300">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                    <Plus className="h-6 w-6 text-[#0B2A96]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold outfit-bold text-[#1E293B]">Create & Configure Match</h2>
                    <p className="text-xs text-slate-400 font-medium">Host a room with custom rules</p>
                  </div>
                </div>

                {/* Configurations Section */}
                <div className="space-y-5 mb-8">
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
              </div>
              
              <button 
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full h-14 bg-[#0B2A96] text-white font-bold text-base rounded-2xl hover:bg-[#0B2A96]/95 active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Creating Room...
                  </>
                ) : (
                  <>
                    <Swords className="h-5 w-5" /> Host Match
                  </>
                )}
              </button>
            </div>

            {/* Join Room Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between group hover:border-[#F59E0B]/50 transition-all duration-300 min-h-[396px]">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-xs">
                    <Users className="h-6 w-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold outfit-bold text-[#1E293B]">Join Room</h2>
                    <p className="text-xs text-slate-400 font-medium">Connect using an invite code</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-12 leading-relaxed">
                  Have an invite link or a 6-digit room code? Paste the link in your browser or enter the alphanumeric code below to join the battle lobby.
                </p>
              </div>
              
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-Digit Code"
                  maxLength={6}
                  className="w-full h-14 bg-slate-50 border border-slate-200/80 rounded-2xl px-6 font-mono text-xl tracking-[0.2em] uppercase text-center focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 placeholder:text-sm font-semibold"
                />
                <button 
                  type="submit"
                  disabled={joinCode.trim().length !== 6}
                  className="w-full h-14 bg-[#F59E0B] text-white font-bold text-base rounded-2xl hover:bg-[#F59E0B]/95 active:scale-[0.98] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Join Match <ArrowRight className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="created"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 shadow-lg text-center border-t-4 border-t-[#0B2A96]"
          >
            <div className="inline-flex items-center justify-center h-16 w-16 bg-[#0B2A96]/10 rounded-full mb-4">
              <CheckCircle2 className="h-8 w-8 text-[#0B2A96]" />
            </div>
            
            <h2 className="text-3xl font-black outfit-bold text-[#1E293B] mb-2">Match Room Created!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your room is live. Invite your opponent using the options below or copy the direct link.
            </p>

            {/* Room Code */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Room Code
              </div>
              <div className="text-3xl font-mono font-extrabold tracking-widest text-[#1E293B]">
                {createdCode}
              </div>
            </div>

            {/* Shareable Link Input */}
            <div className="space-y-1.5 text-left mb-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Shareable Room Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/dashboard/arena/${createdCode}`}
                  className="flex-1 h-12 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 text-xs font-semibold text-slate-500 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="h-12 w-12 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500 animate-in zoom-in duration-200" />
                  ) : (
                    <Copy className="h-5 w-5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Invite Friends Panel */}
            <div className="border-t border-slate-100 pt-6 mb-8 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm text-[#1E293B] uppercase tracking-wider outfit-bold flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-[#0B2A96]" />
                  Invite via Direct Chat
                </h3>
                
                {/* Micro Search within friends list */}
                {friends.length > 0 && (
                  <div className="relative w-44">
                    <Search className="absolute left-3 top-2.5 h-3 w-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={friendSearchQuery}
                      onChange={(e) => setFriendSearchQuery(e.target.value)}
                      className="w-full h-8 bg-slate-50 border border-slate-200/60 rounded-xl pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B2A96]/30"
                    />
                  </div>
                )}
              </div>

              {loadingFriends ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0B2A96]" />
                  <span className="text-xs font-semibold">Loading friends list...</span>
                </div>
              ) : friends.length === 0 ? (
                <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <p className="text-slate-400 text-xs font-medium">You don't have any friends added yet.</p>
                  <p className="text-slate-400 text-[10px] mt-0.5">Go to the Lobby section to find and add friends.</p>
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  No friends matched your search.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                  {filteredFriends.map((friend: any) => {
                    const isInvited = invitedIds.includes(friend.id);
                    return (
                      <div 
                        key={friend.id}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl bg-[#0B2A96]/10 flex items-center justify-center font-bold text-xs text-[#0B2A96] uppercase">
                            {friend.username.substring(0, 2)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-700">{friend.username}</div>
                            <div className="text-[9px] text-slate-400 font-semibold uppercase">{friend.favoriteTeam || "no team"} • {friend.points} pts</div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleInviteFriend(friend.id, friend.username)}
                          disabled={isInvited}
                          className={`h-8 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isInvited 
                              ? "bg-green-50 text-green-600 border border-green-200" 
                              : "bg-[#0B2A96] text-white hover:bg-[#0B2A96]/90 active:scale-[0.97]"
                          }`}
                        >
                          {isInvited ? (
                            <>
                              <Check className="h-3 w-3" /> Invited
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

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setStep("configure")}
                className="h-13 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors"
              >
                Back to Config
              </button>
              <button
                onClick={() => router.push(`/dashboard/arena/${createdCode}`)}
                className="h-13 bg-[#0B2A96] text-white font-bold text-sm rounded-xl hover:bg-[#0B2A96]/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Enter Arena Room <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
