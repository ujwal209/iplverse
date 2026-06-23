"use client";

import { useState, useEffect } from "react";
import { Users, ThumbsUp, Medal, Flame, Loader2 } from "lucide-react";
import { getGlobalLeaderboard, getCommunityXIs, toggleVoteXI, getTopCreators } from "@/app/actions/community";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function CommunityPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"xis" | "leaderboard">("xis");
  const [loading, setLoading] = useState(true);
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [xis, setXis] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (activeTab === "leaderboard") {
        const data = await getGlobalLeaderboard();
        const topCreators = await getTopCreators();
        setLeaderboard(data || []);
        setCreators(topCreators || []);
      } else {
        const data = await getCommunityXIs();
        setXis(data || []);
      }
      setLoading(false);
    }
    loadData();
  }, [activeTab]);

  const handleVote = async (id: string) => {
    if (!user) {
      alert("Please sign in to vote!");
      return;
    }
    setVoting(id);
    const res = await toggleVoteXI(id);
    if (res?.success) {
      // Optimistic refresh
      const data = await getCommunityXIs();
      setXis(data || []);
    }
    setVoting(null);
  };

  return (
    <div className="flex flex-col min-h-[80vh] w-full p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-display text-4xl sm:text-5xl tracking-tight mb-4">Community</h1>
        <p className="text-body text-lg text-muted-foreground max-w-2xl mx-auto">
          Vote on the best All-Time XIs and see who the top IPL Verse players are.
        </p>
        <div className="mt-8">
          <Link href="/dashboard/community/create" className="px-8 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors inline-flex items-center gap-2 shadow-sm">
            <Flame className="h-5 w-5" />
            Create Your XI
          </Link>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-muted/50 p-1 rounded-md flex gap-1">
          <button 
            onClick={() => setActiveTab("xis")}
            className={`px-8 py-2.5 rounded-md font-medium transition-colors ${activeTab === 'xis' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            All-Time XIs
          </button>
          <button 
            onClick={() => setActiveTab("leaderboard")}
            className={`px-8 py-2.5 rounded-md font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Global Rankings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : activeTab === "xis" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {xis.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              No All-Time XIs created yet. Be the first!
            </div>
          ) : xis.map((xi) => (
            <div key={xi.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading text-lg">{xi.title}</h3>
                  <p className="text-caption">by {xi.users?.username || "Unknown"}</p>
                </div>
                <button 
                  onClick={() => handleVote(xi.id)}
                  disabled={voting === xi.id}
                  className="flex flex-col items-center bg-secondary/10 text-secondary rounded-md px-3 py-2 cursor-pointer hover:bg-secondary/20 transition-colors disabled:opacity-50"
                >
                  <ThumbsUp className="h-4 w-4 mb-1" />
                  <span className="text-xs font-bold">{xi.upvotes}</span>
                </button>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-hidden relative">
                {xi.players?.map((player: string, index: number) => (
                  <div key={index} className="text-sm font-medium border-b border-border/40 pb-2 text-muted-foreground">
                    {index + 1}. <span className="text-foreground">{player}</span>
                  </div>
                ))}
                {xi.players?.length > 3 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                )}
              </div>
              <button disabled className="w-full mt-4 py-2 bg-muted text-muted-foreground rounded-md text-sm font-medium opacity-50 cursor-not-allowed">
                View Full Team
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="max-w-3xl mx-auto w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border/40">
            <h2 className="font-heading text-xl flex items-center gap-2">
              <Medal className="h-5 w-5 text-yellow-500" />
              Top Players
            </h2>
          </div>
          <div className="divide-y divide-border/40">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No ranked players yet.
              </div>
            ) : leaderboard.map((player, i) => (
              <div key={i} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                <div className={`w-8 text-center font-heading text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  #{i + 1}
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center font-bold text-primary">
                  {player.username?.substring(0, 2).toUpperCase() || "P"}
                </div>
                <div className="flex-1">
                  <p className="font-heading">{player.username}</p>
                  <p className="text-caption flex items-center gap-1">
                    <Flame className="h-3 w-3 text-rose-500" /> {player.current_streak || 0} day streak
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-foreground">{player.total_points || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-8">
          <div className="p-6 border-b border-border/40">
            <h2 className="font-heading text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Creators
            </h2>
          </div>
          <div className="divide-y divide-border/40">
            {creators.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No creators yet.
              </div>
            ) : creators.map((creator, i) => (
              <div key={i} className="p-4 sm:p-6 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                <div className={`w-8 text-center font-heading text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-heading">{creator.username}</p>
                  <p className="text-caption flex items-center gap-1">
                    Created {creator.xi_count} XIs
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-foreground">{creator.total_upvotes || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Upvotes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
