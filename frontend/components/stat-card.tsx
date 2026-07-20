import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ label, value, icon: Icon, accent = false }: StatCardProps) {
  return (
    <Card className="animate-fade-up overflow-hidden">
      <div className={cn("catalog-edge", accent && "opacity-70")} />
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full",
            accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
