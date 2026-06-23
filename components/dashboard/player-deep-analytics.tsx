"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, Target, Activity } from "lucide-react";
import { getPlayerPhaseStats, getPlayerMatchImpact, getPlayerContextStats } from "@/app/actions/analytics";

interface PlayerDeepAnalyticsProps {
  playerId: string;
}

export function PlayerDeepAnalytics({ playerId }: PlayerDeepAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("phase");
  const [loading, setLoading] = useState(true);
  
  const [phaseStats, setPhaseStats] = useState<any>(null);
  const [impactStats, setImpactStats] = useState<any[]>([]);
  const [contextStats, setContextStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [phase, impact, context] = await Promise.all([
        getPlayerPhaseStats(playerId),
        getPlayerMatchImpact(playerId),
        getPlayerContextStats(playerId)
      ]);
      
      if (phase.success) setPhaseStats(phase.data);
      if (impact.success) setImpactStats(impact.data?.data || []);
      if (context.success) setContextStats(context.data?.data || []);
      
      setLoading(false);
    };
    
    fetchData();
  }, [playerId]);

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm mt-8">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-2xl font-bold outfit-bold">
          <Activity className="h-6 w-6 text-primary" />
          Deep Analytics
        </h3>
        <p className="text-sm text-muted-foreground inter-regular mt-1">
          Explore advanced performance breakdowns across different phases, match outcomes, and match situations.
        </p>
      </div>

      <div className="w-full">
        {/* Tabs List */}
        <div className="flex flex-col sm:flex-row gap-2 p-1 bg-muted/50 rounded-xl w-full max-w-2xl mb-6 border border-border/50">
          <button
            onClick={() => setActiveTab("phase")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'phase' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
          >
            <Clock className="h-4 w-4" /> Phase Analysis
          </button>
          <button
            onClick={() => setActiveTab("impact")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'impact' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
          >
            <TrendingUp className="h-4 w-4" /> Match Impact
          </button>
          <button
            onClick={() => setActiveTab("context")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'context' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
          >
            <Target className="h-4 w-4" /> Context Stats
          </button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div>
            {/* Phase Analysis Tab */}
            {activeTab === "phase" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {!phaseStats?.powerplay && !phaseStats?.middleOvers && !phaseStats?.deathOvers ? (
                  <p className="text-center text-muted-foreground p-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No phase data available for this player.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PhaseCard title="Powerplay (1-6)" data={phaseStats?.powerplay} highlightColor="text-blue-500" />
                    <PhaseCard title="Middle Overs (7-15)" data={phaseStats?.middleOvers} highlightColor="text-yellow-500" />
                    <PhaseCard title="Death Overs (16-20)" data={phaseStats?.deathOvers} highlightColor="text-red-500" />
                  </div>
                )}
              </div>
            )}

            {/* Match Impact Tab */}
            {activeTab === "impact" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {impactStats.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No match impact data available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {impactStats.map((stat, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl border transition-all ${stat.outcome === 'Win' ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-red-500/5 border-red-500/20'}`}>
                        <h4 className={`text-xl font-bold mb-4 uppercase tracking-wider ${stat.outcome === 'Win' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          In {stat.outcome}s
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <MetricBox label="Runs" value={stat.runs} />
                          <MetricBox label="Average" value={stat.average} highlight />
                          <MetricBox label="Balls Faced" value={stat.balls} />
                          <MetricBox label="Dismissals" value={stat.dismissals} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Context Stats Tab */}
            {activeTab === "context" && (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                {contextStats.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8 bg-muted/20 rounded-xl border border-dashed border-border/50">No context data available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {contextStats.map((stat, idx) => (
                      <div key={idx} className="p-6 rounded-2xl border bg-muted/10 border-border/50 hover:bg-muted/30 transition-colors">
                        <h4 className="text-lg font-bold mb-4 capitalize text-primary">{stat.context} Target</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <MetricBox label="Runs" value={stat.runs} />
                          <MetricBox label="Average" value={stat.average} highlight />
                          <MetricBox label="Strike Rate" value={stat.strike_rate} highlight />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseCard({ title, data, highlightColor }: { title: string, data: any, highlightColor: string }) {
  if (!data) return (
    <div className="p-6 rounded-2xl border bg-muted/20 border-dashed border-border/50 text-center flex flex-col items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground/60 mt-2">No data</p>
    </div>
  );

  return (
    <div className="p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-full h-1 bg-current opacity-20 ${highlightColor}`}></div>
      <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">{title}</h4>
      <div className="space-y-4">
        <div className="flex justify-between items-end border-b border-border/40 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Runs</span>
          <span className={`text-2xl font-bold outfit-bold ${highlightColor}`}>{data.runs}</span>
        </div>
        <div className="flex justify-between items-end border-b border-border/40 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Strike Rate</span>
          <span className="text-lg font-bold outfit-bold">{data.strike_rate || "-"}</span>
        </div>
        <div className="flex justify-between items-end border-b border-border/40 pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Average</span>
          <span className="text-lg font-bold outfit-bold">{data.average || "-"}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Dismissals</span>
          <span className="text-lg font-bold outfit-bold">{data.dismissals}</span>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col justify-center text-center ${highlight ? 'bg-background shadow-sm border-border' : 'bg-transparent border-transparent'}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground inter-bold mb-1">{label}</p>
      <p className={`text-lg sm:text-xl outfit-bold ${highlight ? 'text-foreground' : 'text-muted-foreground'}`}>{value}</p>
    </div>
  );
}
