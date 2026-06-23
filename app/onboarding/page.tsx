"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Trophy, Star, Shield, Zap, ChevronDown } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { completeOnboarding } from "./actions";

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Branding Side */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-primary/40 via-transparent to-transparent"></div>
        <div className="relative z-10 flex items-center">
          <img src="/main_logo.png" alt="IPL Verse Logo" className="h-20 w-auto object-contain animate-pulse" />
        </div>
        <div className="relative z-10 space-y-6 max-w-lg mt-auto mb-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary text-caption font-bold tracking-wide uppercase mb-4">
            Account Verified
          </div>
          <h1 className="text-display text-4xl lg:text-6xl leading-tight">
            Build your legacy.
          </h1>
          <p className="text-body text-lg opacity-90 leading-relaxed">
            Welcome to the ultimate cricket platform. Tell us a bit about your fandom to personalize your leaderboard and auction experience.
          </p>
        </div>
        <div className="relative z-10 text-caption opacity-75">
          © {new Date().getFullYear()} IPL Verse. All rights reserved.
        </div>
        
        {/* Aesthetic Background Elements */}
        <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl"></div>
        <Trophy className="absolute top-32 -right-24 h-96 w-96 text-primary-foreground/5 rotate-12" />
      </div>

      {/* Right Form Side */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 overflow-y-auto relative">
        <div className="lg:hidden w-full flex items-center justify-center mb-8">
          <img src="/main_logo.png" alt="IPL Verse Logo" className="h-16 w-auto object-contain" />
        </div>

        <div className="w-full max-w-xl mx-auto my-auto flex flex-col justify-center space-y-8">
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-display text-3xl tracking-tight">Complete your profile</h2>
            <p className="text-muted-foreground text-body text-lg">
              Set up your identity to start climbing the global ranks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 flex flex-col">
                <label htmlFor="username" className="font-heading text-foreground text-sm">Username</label>
                <input 
                  id="username" 
                  placeholder="msd_fan_07" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body" 
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <label htmlFor="favoritePlayer" className="font-heading text-foreground text-sm">Favorite Player</label>
                <input 
                  id="favoritePlayer" 
                  placeholder="e.g. Virat Kohli" 
                  value={favoritePlayer}
                  onChange={(e) => setFavoritePlayer(e.target.value)}
                  className="w-full h-12 px-4 rounded-md bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body" 
                />
              </div>
            </div>
            
            <div className="space-y-2 flex flex-col">
              <label htmlFor="team" className="font-heading text-foreground text-sm">Favorite IPL Team</label>
              <div className="relative">
                <select 
                  id="team"
                  value={team} 
                  onChange={(e) => setTeam(e.target.value)}
                  className="appearance-none w-full h-12 px-4 rounded-md bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body cursor-pointer"
                >
                  <option value="" disabled>Select your team</option>
                  {IPL_TEAMS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="font-heading text-foreground text-sm">Cricket Experience Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {EXPERIENCE_LEVELS.map((level) => {
                  const Icon = level.icon;
                  const isSelected = experience === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setExperience(level.value)}
                      className={`flex flex-col items-center justify-center p-4 rounded-md border-2 transition-all duration-200 ${
                        isSelected 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "border-border bg-card hover:border-primary/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? "text-primary" : "opacity-70"}`} />
                      <span className="text-caption font-bold text-center leading-tight">
                        {level.label.split(' (')[0]}
                      </span>
                      <span className="text-[10px] text-center opacity-70 mt-1">
                        ({level.label.split('(')[1]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground text-lg rounded-md mt-8 font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? "Saving Profile..." : "Enter The Arena"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
