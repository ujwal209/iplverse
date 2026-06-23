import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GameHeaderProps {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  action?: ReactNode;
  className?: string;
}

export function GameHeader({ title, subtitle, backHref = "/", action, className }: GameHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href={backHref}
            className="h-8 w-8 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-display text-2xl sm:text-3xl">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-body text-muted-foreground ml-11">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="ml-11 sm:ml-0">
          {action}
        </div>
      )}
    </div>
  );
}
