import { Activity, Target, UserCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getPlayerCareer, getAdvancedBatting, getAdvancedBowling, fetchPlayerImage } from "@/app/actions/analytics";
import { PlayerMatchups } from "@/components/dashboard/player-matchups";
import { PlayerDeepAnalytics } from "@/components/dashboard/player-deep-analytics";

export default async function PlayerProfilePage({ params }: { params: Promise<{ playerName: string }> }) {
  const resolvedParams = await params;
  const playerId = decodeURIComponent(resolvedParams.playerName);

  const { supabase } = await import('@/lib/supabase');
  const { data: playerMeta } = await supabase.from('players').select('name').eq('id', playerId).single();
  const displayPlayerName = playerMeta?.name || playerId;

  const [careerRes, battingRes, bowlingRes, imageRes] = await Promise.all([
    getPlayerCareer(playerId),
    getAdvancedBatting(playerId),
    getAdvancedBowling(playerId),
    fetchPlayerImage(playerId)
  ]);

  const careerData = careerRes.success ? careerRes.data?.data : null;
  const battingData = battingRes.success ? battingRes.data?.data : null;
  const bowlingData = bowlingRes.success ? bowlingRes.data?.data : null;

  return (
    <div className="relative min-h-screen pb-12">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      <Link href="/dashboard/analytics/players" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Search
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-border/40 pb-6 relative">
        <div className="relative shrink-0">
          {imageRes ? (
            <img src={imageRes} alt={displayPlayerName} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-xl border-4 border-background" />
          ) : (
            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
              <UserCircle className="h-12 w-12 sm:h-16 sm:w-16 text-primary/50" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-4xl sm:text-5xl font-bold outfit-bold tracking-tight">{displayPlayerName}</h2>
          <p className="text-muted-foreground inter-medium text-lg mt-2">Career Overview & Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        {/* Career Stats */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden group/card transition-all hover:shadow-primary/5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold outfit-bold">Career Statistics</h3>
          </div>
          <div>
            {careerData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatBox label="Matches" value={careerData.matches} />
                <StatBox label="Runs" value={careerData.runs} />
                <StatBox label="Batting Avg" value={careerData.batting_average} />
                <StatBox label="Strike Rate" value={careerData.batting_strike_rate} />
                <StatBox label="Highest Score" value={careerData.highest_score} />
                <StatBox label="50s / 100s" value={`${careerData.fifties || 0} / ${careerData.hundreds || 0}`} />
                <StatBox label="Fours" value={careerData.fours} />
                <StatBox label="Sixes" value={careerData.sixes} />
                <StatBox label="Wickets" value={careerData.wickets} />
                <StatBox label="Bowling Avg" value={careerData.bowling_average || "-"} />
                <StatBox label="Economy" value={careerData.economy || "-"} />
                <StatBox label="Best Bowling" value={careerData.best_bowling_figures || "-"} />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm inter-regular">No career data available for this player.</p>
            )}
          </div>
        </div>

        {/* Advanced Stats */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col relative overflow-hidden group/card transition-all hover:shadow-primary/5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-bold outfit-bold">Advanced Metrics</h3>
          </div>
          <div className="space-y-8 flex-1">
            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">Batting Analysis</h4>
              {battingData ? (
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Dot Ball %" value={`${battingData.dot_ball_percentage}%`} highlight />
                  <StatBox label="Boundary %" value={`${battingData.boundary_percentage}%`} highlight />
                  <StatBox label="Boundary Dependency" value={`${battingData.boundary_runs_percentage}%`} />
                  <StatBox label="Runs Per Ball" value={battingData.runs_per_ball} />
                </div>
              ) : <span className="text-sm text-muted-foreground inter-regular">No advanced batting data available.</span>}
            </div>
            
            <div>
              <h4 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">Bowling Analysis</h4>
              {bowlingData ? (
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Dot Ball %" value={`${bowlingData.dot_ball_percentage || 0}%`} highlight />
                  <StatBox label="Boundary %" value={`${bowlingData.boundary_percentage || 0}%`} highlight />
                  <StatBox label="Bowling SR" value={bowlingData.bowling_strike_rate || "-"} />
                  <StatBox label="Runs Per Ball" value={bowlingData.runs_per_ball || "-"} />
                </div>
              ) : <span className="text-sm text-muted-foreground inter-regular">No advanced bowling data available.</span>}
            </div>
          </div>
        </div>
      </div>

      <PlayerMatchups playerId={playerId} displayPlayerName={displayPlayerName} />
      <PlayerDeepAnalytics playerId={playerId} />
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`group p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${highlight ? 'bg-primary/10 border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.1)]' : 'bg-muted/30 border-white/5 backdrop-blur-sm'}`}>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground inter-bold mb-1 truncate group-hover:text-foreground transition-colors">{label}</p>
      <p className={`text-lg sm:text-xl outfit-bold ${highlight ? 'text-primary drop-shadow-sm' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
