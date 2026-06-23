import { ArrowLeft, Flag } from "lucide-react";
import Link from "next/link";
import { getTeamAnalytics } from "@/app/actions/analytics";

export default async function TeamAnalyticsPage({ params }: { params: Promise<{ teamName: string }> }) {
  const resolvedParams = await params;
  const decodedTeam = decodeURIComponent(resolvedParams.teamName);
  const teamRes = await getTeamAnalytics(decodedTeam);
  const teamData = teamRes.success ? (teamRes.data?.data || teamRes.data?.results || teamRes.data) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <Link href="/dashboard/analytics/teams" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Franchise Search
      </Link>

      <div className="flex flex-col items-center justify-center space-y-6 pb-8 border-b border-border/40 text-center">
        <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
          <Flag className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
        </div>
        <div>
          <h2 className="text-4xl sm:text-5xl font-bold outfit-bold tracking-tight">{decodedTeam}</h2>
          <p className="text-muted-foreground inter-medium text-lg mt-2">Historical Performance & Franchise Analytics</p>
        </div>
      </div>

      <div className="pt-4 max-w-5xl mx-auto">
        {!teamData ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            <p className="text-lg">No data found for this franchise.</p>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold outfit-bold text-center">Franchise Metrics</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
              <StatBox label="Matches Played" value={teamData.matches} />
              <StatBox label="Wins" value={teamData.wins} highlight />
              <StatBox label="Losses" value={teamData.losses} />
              <StatBox label="Win Rate" value={`${teamData.win_percentage}%`} highlight />
              <StatBox label="Highest Score" value={teamData.highest_score} />
              <StatBox label="Lowest Score" value={teamData.lowest_score} />
              <StatBox label="Toss Wins" value={teamData.toss_wins} />
              <StatBox label="Titles Won" value={teamData.titles || 0} highlight />
            </div>
          </div>
        )}
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
