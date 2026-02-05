import { Discovery } from "@/types/discovery";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryStatsProps {
  discoveries: Discovery[];
  className?: string;
}

export function GalleryStats({ discoveries, className }: GalleryStatsProps) {
  const completed = discoveries.filter(d => d.status === 'complete');
  const pending = discoveries.filter(d => d.status !== 'complete');
  
  const scores = completed
    .map(d => d.anomaly_score)
    .filter((s): s is number => s !== null);
  
  const avgScore = scores.length > 0 
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : '—';
  
  const highCount = scores.filter(s => s >= 7).length;
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;
  const minScore = scores.length > 0 ? Math.min(...scores) : null;

  const stats = [
    {
      label: 'Total',
      value: discoveries.length,
      icon: Activity,
      color: 'text-primary',
    },
    {
      label: 'Analyzed',
      value: completed.length,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      label: 'Pending',
      value: pending.length,
      icon: Clock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Avg Score',
      value: avgScore,
      icon: Activity,
      color: 'text-primary',
    },
    {
      label: 'High Risk',
      value: highCount,
      icon: AlertTriangle,
      color: 'text-destructive',
    },
    {
      label: 'Highest',
      value: maxScore ?? '—',
      icon: TrendingUp,
      color: 'text-warning',
    },
    {
      label: 'Lowest',
      value: minScore ?? '—',
      icon: TrendingDown,
      color: 'text-success',
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3", className)}>
      {stats.map((stat, i) => (
        <div 
          key={stat.label}
          className="glass-panel p-3 rounded-xl flex items-center gap-2.5"
        >
          <div className={cn("p-1.5 rounded-lg bg-muted/50", stat.color)}>
            <stat.icon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-display font-semibold truncate">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
