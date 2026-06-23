import { ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { getVenueAnalytics } from "@/app/actions/analytics";

export default async function VenueAnalyticsPage({ params }: { params: Promise<{ venueName: string }> }) {
  const resolvedParams = await params;
  const decodedVenue = decodeURIComponent(resolvedParams.venueName);
  const venueRes = await getVenueAnalytics(decodedVenue);
  const venueData = venueRes.success ? (venueRes.data?.data || venueRes.data?.results || venueRes.data) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <Link href="/dashboard/analytics/venues" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Venues Search
      </Link>

      <div className="flex flex-col items-center justify-center space-y-6 pb-8 border-b border-border/40 text-center">
        <div className="h-24 w-24 sm:h-32 sm:w-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-background shadow-xl">
          <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
        </div>
        <div>
          <h2 className="text-4xl sm:text-5xl font-bold outfit-bold tracking-tight">{decodedVenue}</h2>
          <p className="text-muted-foreground inter-medium text-lg mt-2">Historical Stadium Statistics & Pitch Behaviors</p>
        </div>
      </div>

      <div className="pt-4 max-w-5xl mx-auto">
        {!venueData ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            <p className="text-lg">No data found for this stadium.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold outfit-bold">Scoring Overview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Matches Played" value={venueData.matches_played} />
                <StatBox label="Highest Total" value={venueData.highest_total} highlight />
                <StatBox label="Lowest Total" value={venueData.lowest_total} />
                <StatBox label="Avg 1st Inns" value={venueData.avg_first_innings_score} highlight />
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold outfit-bold">Pitch Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <StatBox label="Bat First Win %" value={`${venueData.bat_first_win_percentage}%`} />
                <StatBox label="Bowl First Win %" value={`${venueData.bowl_first_win_percentage}%`} />
                <StatBox label="Pace Wickets" value={venueData.pace_wickets} highlight />
                <StatBox label="Spin Wickets" value={venueData.spin_wickets} highlight />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground inter-bold mb-2">{label}</p>
      <p className={`text-2xl outfit-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
