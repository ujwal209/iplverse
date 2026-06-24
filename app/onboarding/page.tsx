"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Trophy, Star, Shield, Zap, ChevronDown, CheckCircle2, ChevronRight, User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "./actions";

import { getAllTeams } from "@/app/actions/games";
import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";

const EXPERIENCE_LEVELS = [
  { value: "rookie", label: "Rookie (New to Cricket)", icon: Star },
  { value: "pro", label: "Pro (Regular Viewer)", icon: Zap },
  { value: "legend", label: "Legend (Cricket Encyclopedia)", icon: Shield },
];

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [team, setTeam] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState("");
  const [experience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamsDb, setTeamsDb] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await getAllTeams();
        if (res.success && res.teams) {
          setTeamsDb(res.teams);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !team || !favoritePlayer || !experience) {
      setError("Please fill in all the details to continue.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const result = await completeOnboarding({
        username,
        favorite_team: team,
        favorite_player: favoritePlayer,
        experience_level: experience
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
      
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        <div className="w-full flex items-center justify-center mb-10">
          <img src="/main_logo.png" alt="IPL Verse Logo" className="h-28 w-auto object-contain" />
        </div>

        <div className="w-full bg-white rounded-3xl shadow-xl shadow-[#0B2A96]/5 border border-slate-100 p-8 sm:p-14">
          <div className="space-y-3 text-center mb-12">
            <h2 className="text-display text-4xl lg:text-5xl tracking-tight text-[#0B2A96] font-semibold">Complete your profile</h2>
            <p className="text-slate-500 text-body text-lg font-medium">
              Set up your identity to start climbing the global ranks.
            </p>
          </div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="space-y-8"
          >
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <span className="text-rose-500 font-black">!</span>
                </div>
                {error}
              </motion.div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3 flex flex-col relative group"
              >
                <label htmlFor="username" className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B2A96]" />
                  Username
                </label>
                <input 
                  id="username" 
                  placeholder="e.g. msd_fan_07" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-16 px-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B2A96] focus:ring-4 focus:ring-[#0B2A96]/10 transition-all font-medium text-lg shadow-sm" 
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 flex flex-col"
              >
                <label htmlFor="favoritePlayer" className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#0B2A96]" />
                  Favorite Player
                </label>
                {/* The Autocomplete component usually has its own styling, so we wrap it beautifully */}
                <div className="relative rounded-2xl bg-white border-2 border-slate-100 shadow-sm focus-within:border-[#0B2A96] focus-within:ring-4 focus-within:ring-[#0B2A96]/10 transition-all">
                  <div className="h-16 flex items-center w-full px-2">
                    <PlayerAutocomplete 
                      label=""
                      placeholder="Search for a player..." 
                      value={favoritePlayer}
                      onChange={(val) => setFavoritePlayer(val)}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4 pt-6"
            >
              <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#0B2A96]" />
                  <span>Favorite IPL Team</span>
                </div>
                {team && <span className="text-xs bg-[#0B2A96]/10 text-[#0B2A96] px-3 py-1 rounded-full font-semibold">{team}</span>}
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto p-4 border-2 border-slate-100 rounded-3xl bg-slate-50/50 shadow-inner custom-scrollbar">
                {teamsDb.length > 0 ? teamsDb.map((t, idx) => {
                  const isSelected = team === t.name;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + (idx * 0.05) }}
                      key={t.id} 
                      onClick={() => setTeam(t.name)}
                      className={`relative cursor-pointer rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 border-2 gap-3 min-h-[140px] ${
                        isSelected 
                          ? "border-[#0B2A96] bg-white shadow-lg shadow-[#0B2A96]/20 scale-[1.02] z-10" 
                          : "border-transparent bg-white hover:border-[#0B2A96]/30 hover:shadow-md hover:-translate-y-1"
                      }`}
                    >
                      {t.image_url ? (
                        <div className="relative w-16 h-16 shrink-0">
                          <img src={t.image_url} alt={t.name} className="absolute inset-0 w-full h-full object-contain drop-shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center bg-slate-100 rounded-full">
                          <span className="text-sm font-semibold text-slate-800">{t.short_name}</span>
                        </div>
                      )}
                      
                      <span className="text-xs font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                        {t.name}
                      </span>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-3 -right-3 bg-[#0B2A96] text-white rounded-full p-1 shadow-md border-2 border-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                }) : (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B2A96]"></div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4 pt-6"
            >
              <label className="font-semibold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#0B2A96]" />
                Cricket Experience Level
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {EXPERIENCE_LEVELS.map((level) => {
                  const Icon = level.icon;
                  const isSelected = experience === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setExperience(level.value)}
                      className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all duration-300 overflow-hidden group ${
                        isSelected 
                          ? "border-transparent text-white shadow-xl shadow-[#0B2A96]/20 scale-[1.02]" 
                          : "border-slate-100 bg-white hover:border-[#0B2A96]/30 text-slate-500 hover:shadow-md hover:-translate-y-1"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0B2A96] to-[#1a3db5] -z-10"></div>
                      )}
                      
                      <Icon className={`w-8 h-8 mb-3 transition-transform duration-300 group-hover:scale-110 ${isSelected ? "text-white drop-shadow-md" : "text-slate-400"}`} />
                      <span className={`text-base font-semibold text-center leading-tight ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {level.label.split(' (')[0]}
                      </span>
                      <span className={`text-xs text-center mt-2 font-medium ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                        ({level.label.split('(')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="pt-8"
            >
              <button 
                type="submit" 
                disabled={loading}
                className="group relative w-full h-16 bg-[#0B2A96] text-white text-xl rounded-2xl font-semibold hover:bg-[#081e6e] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-[#0B2A96]/30 hover:shadow-[#0B2A96]/50 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-b-transparent"></div>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-blue-200" />
                      <span>Enter The Arena</span>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
