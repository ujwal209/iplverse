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
  ChevronRight,
  Play,
  Clock,
  Award,
  HelpCircle,
  Zap,
  ArrowRight,
  Swords,
  ChevronLeft,
  X,
  Shield,
  Flag,
  BarChart3,
  Users,
  History,
  User,
  Mail
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { GlobalNav } from "@/components/global-nav";
import { Sidebar } from "@/components/dashboard/sidebar";


const games = [
  {
    id: "guess-who",
    title: "Guess Who",
    description: "Deduce the mystery IPL cricketer in 6 attempts using visual clues like batting/bowling style, nationality, and team history.",
    icon: Search,
    href: "/games/guess-who",
    difficulty: "Easy",
    time: "2 mins",
    xp: "100 XP"
  },
  {
    id: "stat-smash",
    title: "Stat Smash",
    description: "Compare historic statistics of IPL legends. Guess if the target player's stats are higher or lower to build your streak.",
    icon: Target,
    href: "/games/stat-smash",
    difficulty: "Medium",
    time: "3 mins",
    xp: "150 XP"
  },
  {
    id: "guess-match",
    title: "Guess the Match",
    description: "Analyze a partially redacted historic match sheet. Deduce the exact IPL clash based on wickets, runs, and partnerships.",
    icon: Gamepad2,
    href: "/games/guess-match",
    difficulty: "Hard",
    time: "5 mins",
    xp: "250 XP"
  },
  {
    id: "career-path",
    title: "Career Path",
    description: "Reconstruct a player's franchise timeline chronologically from their debut season up to their current squad list.",
    icon: MapPin,
    href: "/games/career-path",
    difficulty: "Medium",
    time: "4 mins",
    xp: "150 XP"
  },
  {
    id: "connections",
    title: "Connections",
    description: "Group a grid of 16 IPL stars into 4 distinct groups of 4 based on subtle shared associations, milestones, or team histories.",
    icon: Network,
    href: "/games/connections",
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
    href: "/games/arena-quiz",
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

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [roomCode, setRoomCode] = useState("");


  const handleJoinMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length === 6) {
      router.push(`/dashboard/arena/${roomCode.toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 font-sans">
      <GlobalNav />
      <Sidebar mobileOnly={true} />
      
      <main className="flex-grow flex flex-col font-sans">
        {/* Full-Width White 1v1 Battle Arena Hero Section */}
        <section className="relative z-10 w-full font-sans select-none overflow-hidden bg-white border-b border-slate-100 mb-20">
          {/* Subtle Light Pattern */}
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-slate-50/50 pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center min-h-[500px]">
            
            {/* Left Content */}
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
              <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-[#0B2A96]/5 text-[#0B2A96] text-[11px] font-black uppercase tracking-[0.2em] border border-[#0B2A96]/10 shadow-sm">
                Live Multiplayer Arena
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight drop-shadow-sm font-sans animate-in fade-in slide-in-from-bottom-8 duration-500">
                1v1 Battle Arena
              </h1>
              
              <p className="text-slate-600 text-lg sm:text-xl leading-relaxed font-medium font-sans animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-xl">
                Challenge friends in real-time cricket trivia. Enter a room code to join instantly, or host your own private match!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Host Match Button */}
                <Link 
                  href={isSignedIn ? "/dashboard/arena" : "/login"}
                  className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 rounded-2xl bg-[#0B2A96] hover:bg-[#082072] text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(11,42,150,0.2)] hover:shadow-[0_15px_40px_rgba(11,42,150,0.3)] cursor-pointer tracking-wider uppercase shrink-0"
                >
                  <Play className="h-5 w-5 fill-white text-white shrink-0" /> Host Match
                </Link>
                
                {/* Google Meet style input group */}
                <form 
                  onSubmit={handleJoinMatchSubmit}
                  className="relative flex items-center w-full sm:w-[380px]"
                >
                  <div className="absolute left-5 text-slate-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <input 
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    maxLength={6}
                    className="w-full h-14 sm:h-16 bg-white border-2 border-slate-200 rounded-2xl pl-14 pr-28 font-mono text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0B2A96]/10 focus:border-[#0B2A96] transition-all uppercase shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={roomCode.trim().length !== 6}
                    className="absolute right-2 h-10 sm:h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer tracking-wider uppercase shadow-md"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Right Visual Imagery */}
            <div className="w-full lg:w-1/2 mt-16 lg:mt-0 flex items-center justify-center relative min-h-[300px]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#0B2A96]/5 rounded-full blur-[80px] pointer-events-none" />
              <img 
                src="/1v1_logo.png" 
                alt="1v1 Battle Arena" 
                className="relative z-10 w-full h-full max-h-[500px] object-contain drop-shadow-[0_20px_50px_rgba(11,42,150,0.15)] animate-in slide-in-from-right-16 fade-in duration-1000"
              />
            </div>

          </div>
        </section>

        {/* Game Library Section - Grid Layout */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col space-y-10 pb-32 justify-center font-sans">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#0B2A96]/10">
            <div className="text-center sm:text-left">
              <h2 className="text-4xl font-black text-[#0B2A96] tracking-tight mb-2">IPL Cricket Arenas</h2>
              <p className="text-sm text-slate-500 font-medium max-w-xl">Explore our collection of cricket mini-games. Click any card to preview the game and dive right in!</p>
            </div>
            <span className="bg-[#0B2A96]/5 text-[#0B2A96] px-5 py-2.5 rounded-full border border-[#0B2A96]/10 uppercase font-black tracking-widest text-[10px] shadow-sm shrink-0">
              Season 2026 Active
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {games.map(game => {
              let imgSrc = "";
              let themeColor = "";
              let gradientFrom = "";
              switch (game.id) {
                case "guess-who": imgSrc = "/guess_the_player.jpeg"; themeColor = "text-emerald-400"; gradientFrom = "from-emerald-950/60"; break;
                case "stat-smash": imgSrc = "/stat_smash.png"; themeColor = "text-rose-400"; gradientFrom = "from-rose-950/60"; break;
                case "guess-match": imgSrc = "/guess_match.png"; themeColor = "text-sky-400"; gradientFrom = "from-sky-950/60"; break;
                case "career-path": imgSrc = "/career-journey.jpeg"; themeColor = "text-amber-400"; gradientFrom = "from-amber-950/60"; break;
                case "connections": imgSrc = "/connections.png"; themeColor = "text-purple-400"; gradientFrom = "from-purple-950/60"; break;
                case "arena-quiz": imgSrc = "/arena_quiz.png"; themeColor = "text-cyan-400"; gradientFrom = "from-cyan-950/60"; break;
                case "battle-arena": imgSrc = "/1v1_logo.png"; themeColor = "text-orange-400"; gradientFrom = "from-orange-950/60"; break;
                default: imgSrc = "/guess_the_player.jpeg"; themeColor = "text-blue-400"; gradientFrom = "from-slate-950/60";
              }

              return (
                <Link 
                  key={game.id}
                  href={game.isMultiplayer ? (isSignedIn ? "/dashboard/arena" : "/login") : game.href}
                  className="group block relative h-[500px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[#0B2A96]/30 transition-all duration-500 hover:-translate-y-2 border border-[#0B2A96]/10 bg-slate-950"
                >
                  {/* Blurred Background Layer (Fills empty space beautifully) */}
                  <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 transition-transform duration-700 group-hover:scale-110 z-0" />
                  
                  {/* Sharp Contain Layer (100% visible, zero slicing) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img src={imgSrc} className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  
                  {/* Thematic color tint for distinct identity */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} to-transparent opacity-80 pointer-events-none z-0 mix-blend-overlay transition-opacity duration-500 group-hover:opacity-100`} />
                  
                  {/* Horizontal text protection gradient (limited width to preserve artwork on right) */}
                  <div className="absolute inset-y-0 left-0 w-[80%] bg-gradient-to-r from-slate-950/95 via-slate-950/50 to-transparent pointer-events-none z-0" />
                  
                  {/* Bottom footer protection gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none z-0" />
                  
                  <div className="absolute inset-0 p-8 sm:p-10 flex flex-col justify-end pointer-events-none z-10">
                    <div className="flex flex-col items-start max-w-[45%] mb-10">
                      <div className="flex flex-wrap gap-2 mb-5">
                        {game.isNew && <span className="bg-emerald-500 text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg">NEW</span>}
                        <span className="bg-[#0B2A96] text-white text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg border border-white/10">{game.difficulty}</span>
                      </div>
                      
                      <h3 className={`text-4xl sm:text-5xl font-black tracking-tight mb-4 text-white drop-shadow-xl transition-colors ${themeColor.replace('text-', 'group-hover:text-')}`}>{game.title}</h3>
                      <p className="text-base font-medium text-slate-300/85 line-clamp-4 leading-relaxed drop-shadow-md">{game.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between w-full mt-auto">
                      <div className="flex gap-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-white/90 bg-white/10 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                          <Clock className="w-3.5 h-3.5" /> {game.time}
                        </span>
                        <span className="flex items-center gap-2 text-xs font-bold text-yellow-400 bg-black/30 border border-yellow-500/20 px-4 py-2 rounded-full backdrop-blur-md">
                          <Award className="w-3.5 h-3.5" /> {game.xp}
                        </span>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-white text-[#0B2A96] flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: Stats Warehouse & Analytics Hub */}
        <section className="w-full bg-muted/30 border-y border-border/50 py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-2">
                  <Network className="h-5 w-5" /> Analytics Hub
                </div>
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-heading text-foreground">Stat Warehouse</h2>
                <p className="text-muted-foreground mt-3 font-medium max-w-2xl">Dive deep into historical IPL data. Compare players, analyze venues, and scout teams with our comprehensive intelligence center.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Player Search", icon: Search, href: "/dashboard/analytics/players", desc: "Find detailed stats for any IPL player." },
                { name: "Head to Head", icon: Swords, href: "/dashboard/analytics/matchups/h2h", desc: "Compare two players directly." },
                { name: "Player vs Team", icon: Shield, href: "/dashboard/analytics/matchups/pvt", desc: "Analyze player performance against specific teams." },
                { name: "Venues", icon: MapPin, href: "/dashboard/analytics/venues", desc: "Stadium statistics and historical data." },
                { name: "Teams", icon: Flag, href: "/dashboard/analytics/teams", desc: "Franchise records and team histories." },
                { name: "Leaderboards", icon: BarChart3, href: "/dashboard/analytics/leaderboards", desc: "All-time top run scorers, wicket takers, and more." }
              ].map((item, i) => (
                <Link href={item.href} key={i} className="group bg-card border border-border hover:border-primary/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold font-heading mb-2 text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: Social Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 overflow-hidden relative shadow-xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Users className="w-64 h-64" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl font-black tracking-tight font-heading text-foreground mb-4">Join the Community</h2>
              <p className="text-lg text-muted-foreground mb-8">Connect with other cricket fanatics, review your match history, and update your profile in the social hub.</p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/community" className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                  <Users className="h-5 w-5" /> View Community
                </Link>
                <Link href="/dashboard/arena/history" className="px-6 py-3 bg-muted text-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-2">
                  <History className="h-5 w-5" /> Match History
                </Link>
                <Link href="/dashboard/profile" className="px-6 py-3 bg-muted text-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-2">
                  <User className="h-5 w-5" /> My Profile
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Game Detail Modal removed */}


      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-200 mt-auto font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-10">
            
            {/* Branding & Legal */}
            <div className="flex flex-col items-center lg:items-start gap-4">
              <img src="/main_logo.png" alt="IPL Verse Logo" className="h-10 w-auto object-contain" />
              <p className="text-sm text-slate-500 font-medium">
                © {new Date().getFullYear()} IPL Verse. All rights reserved.
              </p>
              <div className="flex gap-5 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
                <Link href="/terms" className="hover:text-[#0B2A96] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#0B2A96] transition-colors">Privacy</Link>
              </div>
            </div>
            
            {/* Credits & Contact */}
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-8 sm:gap-10">
              
              {/* Creators */}
              <div className="flex flex-col items-center sm:items-end gap-3 sm:pr-10 sm:border-r border-slate-200">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Built By</div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">Pranay</span>
                  <a href="https://www.linkedin.com/in/pranaysb/" target="_blank" rel="noreferrer" className="flex items-center justify-center h-7 w-7 rounded-md bg-[#0A66C2] text-white shadow-sm shadow-[#0A66C2]/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#0A66C2]/30 transition-all" title="Pranay's LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">Ujwal</span>
                  <a href="https://www.linkedin.com/in/ujwal-venkatesh-b85829326/" target="_blank" rel="noreferrer" className="flex items-center justify-center h-7 w-7 rounded-md bg-[#0A66C2] text-white shadow-sm shadow-[#0A66C2]/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#0A66C2]/30 transition-all" title="Ujwal's LinkedIn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  </a>
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-col items-center sm:items-end gap-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Enquiries & Collaborations</div>
                <a href="mailto:pranaysb9@gmail.com" className="flex items-center gap-3 group" title="pranaysb9@gmail.com">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">pranaysb9@gmail.com</span>
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-[#EA4335] text-white shadow-sm shadow-[#EA4335]/20 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-[#EA4335]/30 transition-all">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                </a>
                <a href="mailto:easynetcraft@gmail.com" className="flex items-center gap-3 group" title="easynetcraft@gmail.com">
                  <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">easynetcraft@gmail.com</span>
                  <div className="flex items-center justify-center h-7 w-7 rounded-md bg-[#EA4335] text-white shadow-sm shadow-[#EA4335]/20 group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:shadow-[#EA4335]/30 transition-all">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                </a>
              </div>
              
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
