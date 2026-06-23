import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GameCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "primary" | "warning" | "danger" | "success" | "accent";
  className?: string;
  isNew?: boolean;
}

const colorStyles = {
  primary: "text-primary bg-primary/10 border-primary/20",
  warning: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  danger: "text-red-500 bg-red-500/10 border-red-500/20",
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
};

export function GameCard({
  href,
  title,
  description,
  icon: Icon,
  color,
  className,
  isNew,
}: GameCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <Card className={cn("h-full hover:border-border hover:bg-muted/10 hover:-translate-y-0.5", className)}>
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center border", colorStyles[color])}>
              <Icon className="h-6 w-6" />
            </div>
            {isNew && (
              <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                New
              </span>
            )}
          </div>
          <div>
            <h3 className="text-heading text-lg mb-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-body text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
