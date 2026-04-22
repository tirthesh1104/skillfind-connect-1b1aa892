import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "primary" | "success" | "warning" | "destructive";
}

const accents = {
  primary: "from-primary/20 to-accent/10 text-accent",
  success: "from-emerald-500/20 to-emerald-500/5 text-emerald-300",
  warning: "from-amber-500/20 to-amber-500/5 text-amber-300",
  destructive: "from-red-500/20 to-red-500/5 text-red-300",
};

export const StatCard = ({ icon: Icon, label, value, hint, accent = "primary" }: Props) => (
  <div className={cn("stat-card relative overflow-hidden bg-gradient-to-br", accents[accent].split(" ")[0], accents[accent].split(" ")[1])}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("rounded-xl bg-background/40 p-2.5", accents[accent].split(" ")[2])}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);
