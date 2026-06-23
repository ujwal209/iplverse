import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-caption font-medium uppercase tracking-wider mb-1">{title}</p>
            <h4 className="text-display text-3xl">{value}</h4>
            {subtitle && <p className="text-caption mt-2">{subtitle}</p>}
          </div>
          {icon && (
            <div className="text-primary/80 bg-primary/10 p-3 rounded-lg">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
