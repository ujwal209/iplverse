import { cn } from "@/lib/utils";

interface LeaderboardCardProps {
  rank: number;
  title: string;
  subtitle?: string;
  metricValue: string | number;
  metricLabel: string;
  avatarText?: string;
  className?: string;
}

export function LeaderboardCard({
  rank,
  title,
  subtitle,
  metricValue,
  metricLabel,
  avatarText,
  className,
}: LeaderboardCardProps) {
  const isTop3 = rank <= 3;
  const rankColor = rank === 1 ? "text-yellow-500" : rank === 2 ? "text-muted-foreground" : rank === 3 ? "text-amber-700" : "text-muted-foreground";

  return (
    <div className={cn("p-4 sm:p-6 flex items-center gap-4 hover:bg-muted/10 transition-colors border-b border-border/40 last:border-0", className)}>
      <div className={cn("w-8 text-center font-black font-outfit text-lg", rankColor)}>
        #{rank}
      </div>
      
      {avatarText && (
        <div className={cn(
          "h-10 w-10 rounded-md flex items-center justify-center font-bold",
          isTop3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {avatarText.substring(0, 2).toUpperCase()}
        </div>
      )}
      
      <div className="flex-1">
        <p className="font-heading">{title}</p>
        {subtitle && (
          <p className="text-caption mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="text-right">
        <p className="font-outfit font-black text-xl text-foreground">{metricValue}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{metricLabel}</p>
      </div>
    </div>
  );
}
