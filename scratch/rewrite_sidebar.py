with open("components/dashboard/sidebar.tsx", "r") as f:
    content = f.read()

# We'll completely rewrite it using framer-motion and the existing data structures.

new_content = """"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  BarChart3, 
  Users, 
  Swords, 
  MapPin, 
  Menu, 
  Shield, 
  Flag, 
  Gamepad2, 
  X, 
  User, 
  LogOut, 
  MessageSquare,
  Search,
  Target,
  Network,
  History,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { UserButton, Show, SignOutButton } from "@clerk/nextjs";

const gameItems = [
  { name: "Guess Who", href: "/dashboard/games/guess-who", icon: Search },
  { name: "Stat Smash", href: "/dashboard/games/stat-smash", icon: Target },
  { name: "Guess the Match", href: "/dashboard/games/guess-match", icon: Gamepad2 },
  { name: "Career Path", href: "/dashboard/games/career-path", icon: MapPin },
  { name: "Connections", href: "/dashboard/games/connections", icon: Network },
  { name: "Arena Quiz", href: "/dashboard/games/arena-quiz", icon: Trophy },
];

const analyticsItems = [
  { name: "Player Search", href: "/dashboard/analytics/players", icon: Users },
  { name: "Head to Head", href: "/dashboard/analytics/matchups/h2h", icon: Swords },
  { name: "Player vs Team", href: "/dashboard/analytics/matchups/pvt", icon: Shield },
  { name: "Venues", href: "/dashboard/analytics/venues", icon: MapPin },
  { name: "Teams", href: "/dashboard/analytics/teams", icon: Flag },
  { name: "Leaderboards", href: "/dashboard/analytics/leaderboards", icon: BarChart3 },
];

const arenaLoungeItems = [
  { name: "Dashboard Hub", href: "/dashboard", icon: LayoutDashboard },
  { name: "1v1 Battle Arena", href: "/dashboard/arena", icon: Swords },
  { name: "Match History", href: "/dashboard/arena/history", icon: History },
  { name: "Lobby & Social", href: "/dashboard/lobby", icon: MessageSquare },
];

const socialItems = [
  { name: "Community", href: "/dashboard/community", icon: Users },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

export function Sidebar({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar_collapsed", newState.toString());
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const renderLink = (item: any, collapsed: boolean) => {
    const isActive = item.href === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    
    return (
      <Link
        key={item.name}
        href={item.href}
        title={collapsed ? item.name : undefined}
        className={`flex items-center ${collapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-200 group inter-medium text-xs sm:text-sm ${
          isActive 
            ? 'bg-primary/10 text-primary font-bold shadow-inner' 
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 transition-all ${isActive ? "text-primary" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}`} />
        {!collapsed && (
           <span className="truncate">{item.name}</span>
        )}
      </Link>
    );
  };

  const NavLinks = ({ collapsed = false }) => (
    <div className="space-y-5">
      <div>
        {!collapsed && <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2 outfit-bold">Arena Lounge</p>}
        {collapsed && <div className="h-px w-6 mx-auto bg-border mb-2" />}
        <div className="space-y-1">
          {arenaLoungeItems.map((item) => renderLink(item, collapsed))}
        </div>
      </div>
      <div>
        {!collapsed && <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2 outfit-bold">Play Arena</p>}
        {collapsed && <div className="h-px w-6 mx-auto bg-border mb-2 mt-4" />}
        <div className="space-y-1">
          {gameItems.map((item) => renderLink(item, collapsed))}
        </div>
      </div>
      <div>
        {!collapsed && <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2 outfit-bold">Analytics Hub</p>}
        {collapsed && <div className="h-px w-6 mx-auto bg-border mb-2 mt-4" />}
        <div className="space-y-1">
          {analyticsItems.map((item) => renderLink(item, collapsed))}
        </div>
      </div>
      <div>
        {!collapsed && <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-2 outfit-bold">Social & Account</p>}
        {collapsed && <div className="h-px w-6 mx-auto bg-border mb-2 mt-4" />}
        <div className="space-y-1">
          {socialItems.map((item) => renderLink(item, collapsed))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!mobileOnly && (
        <motion.aside 
          initial={false}
          animate={{ width: isCollapsed ? 80 : 256 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="hidden lg:flex flex-col flex-shrink-0 border-r border-border/60 bg-card h-full relative"
        >
          {isMounted && (
            <button 
              onClick={toggleCollapse}
              className="absolute -right-3.5 top-6 bg-card border border-border/60 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm hover:shadow-md transition-all z-20 cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}

          <div className="p-4 flex-1 pt-6 overflow-y-auto no-scrollbar">
            <NavLinks collapsed={isCollapsed} />
          </div>
          
          <div className="p-4 border-t border-border/60 mt-auto flex-shrink-0 flex justify-center">
            <Show when="signed-in">
              <SignOutButton>
                <button 
                  title={isCollapsed ? "Sign Out" : undefined}
                  className={`flex items-center ${isCollapsed ? 'justify-center w-10 h-10' : 'gap-3 w-full px-3'} py-2.5 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group inter-medium font-semibold text-sm cursor-pointer`}
                >
                  <LogOut className="h-5 w-5 opacity-70 group-hover:opacity-100 text-red-600" />
                  {!isCollapsed && "Sign Out"}
                </button>
              </SignOutButton>
            </Show>
          </div>
        </motion.aside>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div 
            className="absolute left-0 top-0 bottom-0 w-[280px] bg-card shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 mt-2">
              <div className="flex items-center">
                <img src="/main_logo.png" alt="IPL Verse Logo" className="h-10 w-auto object-contain" />
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-2 bg-muted/50 rounded-full hover:bg-muted text-foreground transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
              <NavLinks collapsed={false} />
            </div>

            <div className="mt-auto pt-4 border-t border-border/60 flex-shrink-0">
              <Show
                when="signed-in"
                fallback={
                  <Link 
                    href="/login"
                    className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 text-sm font-semibold transition-all duration-200"
                  >
                    Sign In
                  </Link>
                }
              >
                <div className="flex items-center justify-between w-full px-2">
                  <div className="flex items-center gap-3">
                    <UserButton appearance={{ elements: { avatarBox: "h-9 w-9 border border-border/50" } }} />
                    <span className="text-sm font-semibold outfit-semibold text-foreground">Account</span>
                  </div>
                  <SignOutButton>
                    <button className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer">
                      Sign Out
                    </button>
                  </SignOutButton>
                </div>
              </Show>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
"""

with open("components/dashboard/sidebar.tsx", "w") as f:
    f.write(new_content)
print("Rewrote components/dashboard/sidebar.tsx")
