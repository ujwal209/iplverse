import { ArrowLeft, Swords } from "lucide-react";
import Link from "next/link";
import { getHeadToHead, fetchPlayerImage } from "@/app/actions/analytics";

export default async function HeadToHeadResultPage({ params }: { params: Promise<{ batter: string, bowler: string }> }) {
  const resolvedParams = await params;
  const batterId = decodeURIComponent(resolvedParams.batter);
  const bowlerId = decodeURIComponent(resolvedParams.bowler);

  const { supabase } = await import('@/lib/supabase');
  
  const [h2hRes, batterImage, bowlerImage, batterMeta, bowlerMeta] = await Promise.all([
    getHeadToHead(batterId, bowlerId),
    fetchPlayerImage(batterId),
    fetchPlayerImage(bowlerId),
    supabase.from('players').select('name').eq('id', batterId).single(),
    supabase.from('players').select('name').eq('id', bowlerId).single()
  ]);

  const h2hData = h2hRes.success ? h2hRes.data?.data : null;
  const batterName = batterMeta?.data?.name || batterId;
  const bowlerName = bowlerMeta?.data?.name || bowlerId;

  return (
    <div className="relative min-h-[80vh]">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto relative z-10">
      <Link href="/dashboard/analytics/matchups/h2h" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to H2H Search
      </Link>

      <div className="flex flex-col items-center justify-center space-y-6 pb-8 border-b border-border/40">
        <div className="flex items-center gap-4 sm:gap-12">
          {/* Batter Side */}
          <div className="flex flex-col items-center gap-4 text-center">
            {batterImage ? (
              <img src={batterImage} alt={batterName} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-xl border-4 border-background" />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                <span className="text-4xl font-bold text-primary">{batterName.charAt(0)}</span>
              </div>
            )}
            <h3 className="font-bold outfit-bold text-xl sm:text-2xl">{batterName}</h3>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">Batter</span>
          </div>

          <Swords className="h-10 w-10 sm:h-16 sm:w-16 text-primary animate-pulse" />

          {/* Bowler Side */}
          <div className="flex flex-col items-center gap-4 text-center">
            {bowlerImage ? (
              <img src={bowlerImage} alt={bowlerName} className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover shadow-xl border-4 border-background" />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
                <span className="text-4xl font-bold text-primary">{bowlerName.charAt(0)}</span>
              </div>
            )}
            <h3 className="font-bold outfit-bold text-xl sm:text-2xl">{bowlerName}</h3>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">Bowler</span>
          </div>
        </div>
      </div>

      <div className="pt-4 max-w-4xl mx-auto">
        <div className="bg-background/40 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle top inner glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="mb-6">
            <h3 className="text-xl font-bold outfit-bold text-center">Matchup Statistics</h3>
          </div>
          <div>
            {h2hData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Runs Scored" value={h2hData.runs} highlight />
                <StatBox label="Balls Faced" value={h2hData.balls} />
                <StatBox label="Strike Rate" value={h2hData.strike_rate} highlight />
                <StatBox label="Dismissals" value={h2hData.dismissals} highlight />
                <StatBox label="Batting Avg" value={h2hData.average || "-"} />
                <StatBox label="Fours" value={h2hData.fours} />
                <StatBox label="Sixes" value={h2hData.sixes} />
                <StatBox label="Dot Balls" value={h2hData.dots} />
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>No historical matchup data found between these two players.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`group p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${highlight ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : 'bg-muted/30 border-white/5 backdrop-blur-sm'}`}>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground inter-bold mb-2 group-hover:text-foreground transition-colors">{label}</p>
      <p className={`text-2xl sm:text-4xl outfit-bold ${highlight ? 'text-primary drop-shadow-md' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
