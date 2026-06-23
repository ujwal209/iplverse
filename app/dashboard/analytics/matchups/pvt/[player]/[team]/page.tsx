import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { getPlayerVsTeam, fetchPlayerImage } from "@/app/actions/analytics";

export default async function PlayerVsTeamResultPage({ params }: { params: Promise<{ player: string, team: string }> }) {
  const resolvedParams = await params;
  const decodedPlayer = decodeURIComponent(resolvedParams.player);
  const decodedTeam = decodeURIComponent(resolvedParams.team);

  const { supabase } = await import('@/lib/supabase');

  const [pvtRes, playerImage, playerMeta] = await Promise.all([
    getPlayerVsTeam(decodedPlayer, decodedTeam),
    fetchPlayerImage(decodedPlayer),
    supabase.from('players').select('name').eq('id', decodedPlayer).single()
  ]);

  const pvtData = pvtRes.success ? pvtRes.data?.data : null;
  const playerName = playerMeta?.data?.name || decodedPlayer;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <Link href="/dashboard/analytics/matchups/pvt" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Search
      </Link>

      <div className="flex flex-col items-center justify-center space-y-6 pb-8 border-b border-border/40">
        <div className="flex items-center gap-4 sm:gap-12">
          {/* Player Side */}
          <div className="flex flex-col items-center gap-4 text-center">
            {playerImage ? (
              <img src={playerImage} alt={playerName} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-xl border-4 border-background" />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                <span className="text-4xl font-bold text-primary">{playerName.charAt(0)}</span>
              </div>
            )}
            <h3 className="font-bold outfit-bold text-xl sm:text-2xl">{playerName}</h3>
          </div>

          <Shield className="h-10 w-10 sm:h-16 sm:w-16 text-primary animate-pulse" />

          {/* Team Side */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/5 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
              <span className="text-3xl font-bold text-primary">{decodedTeam.substring(0, 3).toUpperCase()}</span>
            </div>
            <h3 className="font-bold outfit-bold text-xl sm:text-2xl">{decodedTeam}</h3>
          </div>
        </div>
      </div>

      <div className="pt-4 max-w-4xl mx-auto">
        <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold outfit-bold text-center">Overall Performance vs Franchise</h3>
          </div>
          <div>
            {pvtData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Innings" value={pvtData.innings} />
                <StatBox label="Runs Scored" value={pvtData.runs} highlight />
                <StatBox label="Average" value={pvtData.average || "-"} highlight />
                <StatBox label="Strike Rate" value={pvtData.strike_rate || "-"} highlight />
                <StatBox label="Highest Score" value={pvtData.highest_score} />
                <StatBox label="Wickets" value={pvtData.wickets} />
                <StatBox label="Bowling Avg" value={pvtData.bowling_average || "-"} />
                <StatBox label="Economy" value={pvtData.economy || "-"} />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No data found for this player against {decodedTeam}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground inter-bold mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl outfit-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
