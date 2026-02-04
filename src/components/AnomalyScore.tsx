import { cn } from "@/lib/utils";
import { AlertTriangle, Eye, Radar, Skull } from "lucide-react";

interface AnomalyScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function AnomalyScore({ score, size = "md" }: AnomalyScoreProps) {
  const getScoreConfig = (score: number) => {
    if (score <= 2) {
      return {
        label: "NORMAL",
        color: "text-muted-foreground",
        bg: "bg-muted",
        glow: "",
        icon: Eye,
      };
    }
    if (score <= 4) {
      return {
        label: "CURIOUS",
        color: "text-primary",
        bg: "bg-primary/20",
        glow: "shadow-[0_0_20px_hsl(185_100%_50%_/_0.3)]",
        icon: Eye,
      };
    }
    if (score <= 6) {
      return {
        label: "NOTABLE",
        color: "text-warning",
        bg: "bg-warning/20",
        glow: "shadow-[0_0_25px_hsl(38_92%_50%_/_0.4)]",
        icon: Radar,
      };
    }
    if (score <= 8) {
      return {
        label: "SIGNIFICANT",
        color: "text-destructive",
        bg: "bg-destructive/20",
        glow: "shadow-[0_0_30px_hsl(0_85%_55%_/_0.4)]",
        icon: AlertTriangle,
      };
    }
    return {
      label: "EXTRAORDINARY",
      color: "text-destructive",
      bg: "bg-destructive/30",
      glow: "shadow-[0_0_40px_hsl(0_85%_55%_/_0.6)] animate-pulse",
      icon: Skull,
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: "w-16 h-16",
      score: "text-2xl",
      icon: "w-4 h-4",
      label: "text-[10px]",
    },
    md: {
      container: "w-24 h-24",
      score: "text-4xl",
      icon: "w-5 h-5",
      label: "text-xs",
    },
    lg: {
      container: "w-32 h-32",
      score: "text-5xl",
      icon: "w-6 h-6",
      label: "text-sm",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "relative rounded-full flex flex-col items-center justify-center",
          sizes.container,
          config.bg,
          config.glow,
          "border-2 border-current",
          config.color
        )}
      >
        {/* Rotating ring for high scores */}
        {score >= 7 && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current animate-radar opacity-50" />
        )}
        
        <span className={cn("font-display font-bold", sizes.score, config.color)}>
          {score}
        </span>
        <span className={cn("font-display uppercase tracking-widest", sizes.label, config.color)}>
          /10
        </span>
      </div>
      
      <div className={cn("flex items-center gap-1", config.color)}>
        <Icon className={sizes.icon} />
        <span className={cn("font-display uppercase tracking-wider", sizes.label)}>
          {config.label}
        </span>
      </div>
    </div>
  );
}