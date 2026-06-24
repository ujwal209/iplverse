"use client";

import { useState } from "react";
import { 
  User, 
  Trophy, 
  Flame, 
  Target, 
  Activity, 
  Gamepad2, 
  Edit3, 
  Save, 
  X, 
  Star, 
  Zap, 
  Shield, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { updateUserProfile } from "@/app/actions/social";
import { PlayerAutocomplete } from "@/components/dashboard/player-autocomplete";

const IPL_TEAMS = [
  "Chennai Super Kings",
  "Mumbai Indians",
  "Royal Challengers Bangalore",
  "Kolkata Knight Riders",
  "Sunrisers Hyderabad",
  "Rajasthan Royals",
  "Delhi Capitals",
  "Punjab Kings",
  "Gujarat Titans",
  "Lucknow Super Giants"
];

const iplTeamOptions = IPL_TEAMS.map((team) => ({ value: team, label: team }));

const EXPERIENCE_LEVELS = [
  { value: "rookie", label: "Rookie", desc: "New to cricket", icon: Star, color: "text-emerald-500", bg: "bg-emerald-50" },
  { value: "pro", label: "Pro", desc: "Regular viewer", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
  { value: "legend", label: "Legend", desc: "Cricket encyclopedia", icon: Shield, color: "text-rose-500", bg: "bg-rose-50" }
];

const ALL_ACHIEVEMENTS = [
  { id: 'first_win', title: 'First Blood', description: 'Win your first game', icon: Target, color: 'text-blue-500' },
  { id: '10_wins', title: 'Rising Star', description: 'Win 10 games', icon: Trophy, color: 'text-indigo-500' },
  { id: '50_wins', title: 'Veteran', description: 'Win 50 games', icon: Trophy, color: 'text-purple-500' },
  { id: '100_wins', title: 'Legend', description: 'Win 100 games', icon: Trophy, color: 'text-amber-500' },
  { id: 'streak_7', title: 'On Fire', description: 'Reach a 7-day streak', icon: Flame, color: 'text-orange-500' },
  { id: 'streak_30', title: 'Unstoppable', description: 'Reach a 30-day streak', icon: Flame, color: 'text-red-500' },
];

interface ProfileClientProps {
  dbUser: any;
  email: string;
  unlockedIds: string[];
  teamsDb: any[];
}

export function ProfileClient({ dbUser, email, unlockedIds, teamsDb }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(dbUser.username);
  const [favoriteTeam, setFavoriteTeam] = useState(dbUser.favorite_team || "");
  const [favoritePlayer, setFavoritePlayer] = useState(dbUser.favorite_player || "");
  const [experienceLevel, setExperienceLevel] = useState(dbUser.experience_level || "rookie");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setSaving(true);
    const res = await updateUserProfile({
      username,
      favorite_team: favoriteTeam,
      favorite_player: favoritePlayer,
      experience_level: experienceLevel
    });

    if (res.success) {
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } else {
      toast.error(res.error || "Failed to update profile");
    }
    setSaving(false);
  };

  const handleCancel = () => {
    // Reset fields to original db values
    setUsername(dbUser.username);
    setFavoriteTeam(dbUser.favorite_team || "");
    setFavoritePlayer(dbUser.favorite_player || "");
    setExperienceLevel(dbUser.experience_level || "rookie");
    setIsEditing(false);
  };

  const winRate = dbUser.games_played > 0 
    ? Math.round((dbUser.wins / dbUser.games_played) * 100) 
    : 0;

  const activeLevel = EXPERIENCE_LEVELS.find(l => l.value === experienceLevel) || EXPERIENCE_LEVELS[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold outfit-bold text-[#0B2A96] tracking-tight flex items-center gap-2">
            <User className="h-7 w-7 text-[#0B2A96]" />
            Analyst Profile
          </h1>
          <p className="text-xs text-slate-500 inter-medium mt-1">Manage your identity, edit your preferences, and track your achievements.</p>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#0B2A96] hover:bg-[#0f3a63] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/10 hover:shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Side: Profile Card or Editor */}
        <div className="w-full lg:w-[380px] shrink-0">
          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
              >
                {/* Background decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0B2A96] to-blue-500" />
                
                <div className="h-24 w-24 rounded-full bg-blue-50 border-4 border-slate-50 shadow-md flex items-center justify-center mb-4 mt-2 shrink-0">
                  <User className="h-12 w-12 text-[#0B2A96]" />
                </div>
                
                <h2 className="text-xl font-extrabold text-slate-800 outfit-bold truncate max-w-full px-2">{dbUser.username}</h2>
                <p className="text-xs text-slate-400 inter-medium mt-1 mb-6">{email}</p>
                
                <div className="w-full space-y-3.5">
                  <div className="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Team</span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const t = teamsDb?.find(x => x.name === dbUser.favorite_team);
                        if (t?.image_url) {
                          return <img src={t.image_url} alt={t.name} className="h-6 w-6 object-contain" />;
                        }
                        return null;
                      })()}
                      <span className="font-bold text-xs text-slate-800 truncate max-w-[200px]">{dbUser.favorite_team || "None Selected"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Player</span>
                    <span className="font-bold text-xs text-slate-800 truncate pl-4 max-w-[200px]">{dbUser.favorite_player || "None Selected"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience Level</span>
                    <div className="flex items-center gap-1.5">
                      <activeLevel.icon className={`h-4.5 w-4.5 ${activeLevel.color}`} />
                      <span className="font-bold text-xs text-slate-800 capitalize">{activeLevel.label}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                onSubmit={handleSave}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-5"
              >
                <h3 className="font-extrabold text-sm text-[#0B2A96] uppercase tracking-wider outfit-bold border-b border-slate-100 pb-2">Edit Preferences</h3>
                
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter unique username"
                    className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2A96]/50 focus:border-[#0B2A96] transition-all font-semibold text-slate-800"
                  />
                </div>

                {/* Favorite Team Grid */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Team</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50/50 shadow-inner custom-scrollbar">
                    {teamsDb && teamsDb.length > 0 ? teamsDb.map((t, idx) => {
                      const isSelected = favoriteTeam === t.name;
                      return (
                        <div 
                          key={t.id || idx} 
                          onClick={() => setFavoriteTeam(t.name)}
                          className={`relative cursor-pointer rounded-xl flex flex-col items-center justify-center p-3 transition-all duration-300 border-2 gap-2 min-h-[100px] ${
                            isSelected 
                              ? "border-[#0B2A96] bg-white shadow-md z-10 scale-[1.02]" 
                              : "border-transparent bg-white hover:border-[#0B2A96]/30 hover:shadow-sm"
                          }`}
                        >
                          {t.image_url ? (
                            <div className="relative w-10 h-10 shrink-0">
                              <img src={t.image_url} alt={t.name} className="absolute inset-0 w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-100 rounded-full">
                              <span className="text-xs font-semibold text-slate-800">{t.short_name}</span>
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight line-clamp-2">
                            {t.short_name || t.name}
                          </span>
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-[#0B2A96] text-white rounded-full p-0.5 shadow-sm border-2 border-white">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="col-span-full text-center text-xs text-slate-500 py-4">No teams available</div>
                    )}
                  </div>
                </div>

                {/* Favorite Player */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Favorite Player</label>
                  <div className="relative rounded-xl bg-slate-50/50 border border-slate-200 focus-within:border-[#0B2A96] focus-within:ring-2 focus-within:ring-[#0B2A96]/50 transition-all">
                    <div className="h-11 flex items-center w-full px-1">
                      <PlayerAutocomplete 
                        label=""
                        placeholder="Search for a player..." 
                        value={favoritePlayer}
                        onChange={(val) => setFavoritePlayer(val)}
                      />
                    </div>
                  </div>
                </div>

                {/* Experience Level Picker */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience Level</label>
                  <div className="grid grid-cols-1 gap-2">
                    {EXPERIENCE_LEVELS.map((level) => {
                      const isSelected = experienceLevel === level.value;
                      const IconComponent = level.icon;
                      
                      return (
                        <div
                          key={level.value}
                          onClick={() => setExperienceLevel(level.value)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected 
                              ? "bg-[#0B2A96]/5 border-[#0B2A96] shadow-xs" 
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 hover:border-slate-300"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-white" : level.bg}`}>
                            <IconComponent className={`h-4.5 w-4.5 ${level.color}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{level.label}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{level.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-[#0B2A96] hover:bg-[#0f3a63] disabled:opacity-55 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:cursor-default"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Stats Grid & Achievements */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Games Played" value={dbUser.games_played} icon={Gamepad2} />
            <StatCard label="Win Rate" value={`${winRate}%`} icon={Activity} />
            <StatCard label="Current Streak" value={`${dbUser.current_streak} 🔥`} icon={Flame} />
            <StatCard label="Total Points" value={dbUser.total_points} icon={Trophy} />
          </div>

          {/* Achievements */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-800 outfit-bold flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Trophy className="h-5 w-5 text-amber-500 fill-amber-500/10" />
              Achievements Unlocked
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedIds.includes(ach.id);
                const AchIcon = ach.icon;
                
                return (
                  <div 
                    key={ach.id} 
                    className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                      isUnlocked 
                        ? 'bg-white border-slate-200/80 shadow-xs' 
                        : 'bg-slate-50/30 border-slate-200/50 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-blue-50/50' : 'bg-slate-100'}`}>
                      <AchIcon className={`h-5.5 w-5.5 ${isUnlocked ? ach.color : 'text-slate-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>{ach.title}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">{ach.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex flex-col justify-center relative overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[#0B2A96]/60" />
        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-400 truncate">{label}</p>
      </div>
      <p className="text-2xl sm:text-3xl font-extrabold outfit-bold text-slate-800">{value}</p>
    </div>
  );
}
