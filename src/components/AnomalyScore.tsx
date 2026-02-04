import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Eye, Radar, Skull, Sparkles, Zap } from "lucide-react";

interface AnomalyScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function AnomalyScore({ score, size = "md", animate = true }: AnomalyScoreProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [isAnimating, setIsAnimating] = useState(animate);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    setIsAnimating(true);
    setDisplayScore(0);
    
    const duration = 1500;
    const steps = 30;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(score, Math.round(increment * step * 10) / 10);
      setDisplayScore(Math.round(current));
      
      if (step >= steps) {
        clearInterval(timer);
        setDisplayScore(score);
        setTimeout(() => setIsAnimating(false), 500);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  const getScoreConfig = (score: number) => {
    if (score <= 2) {
      return {
        label: "NORMAL",
        sublabel: "Standard terrain",
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        border: "border-muted-foreground/30",
        glow: "",
        ring: "stroke-muted-foreground/30",
        ringFill: "stroke-muted-foreground/50",
        icon: Eye,
      };
    }
    if (score <= 4) {
      return {
        label: "CURIOUS",
        sublabel: "Minor anomaly",
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/40",
        glow: "shadow-[0_0_25px_hsl(185_100%_55%_/_0.3)]",
        ring: "stroke-primary/30",
        ringFill: "stroke-primary",
        icon: Eye,
      };
    }
    if (score <= 6) {
      return {
        label: "NOTABLE",
        sublabel: "Worth investigating",
        color: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/40",
        glow: "shadow-[0_0_30px_hsl(35_95%_55%_/_0.4)]",
        ring: "stroke-warning/30",
        ringFill: "stroke-warning",
        icon: Radar,
      };
    }
    if (score <= 8) {
      return {
        label: "SIGNIFICANT",
        sublabel: "Unexplained feature",
        color: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/40",
        glow: "shadow-[0_0_35px_hsl(0_90%_55%_/_0.4)]",
        ring: "stroke-destructive/30",
        ringFill: "stroke-destructive",
        icon: AlertTriangle,
      };
    }
    return {
      label: "EXTRAORDINARY",
      sublabel: "Major discovery",
      color: "text-destructive",
      bg: "bg-destructive/20",
      border: "border-destructive/60",
      glow: "shadow-[0_0_50px_hsl(0_90%_55%_/_0.6)] animate-glow-pulse",
      ring: "stroke-destructive/30",
      ringFill: "stroke-destructive",
      icon: Skull,
    };
  };

  const config = getScoreConfig(score);
  const Icon = config.icon;
  const percentage = (displayScore / 10) * 100;

  const sizeClasses = {
    sm: {
      container: "w-20 h-20",
      svgSize: 80,
      strokeWidth: 4,
      score: "text-2xl",
      icon: "w-3 h-3",
      label: "text-[9px]",
      sublabel: "hidden",
    },
    md: {
      container: "w-32 h-32",
      svgSize: 128,
      strokeWidth: 6,
      score: "text-4xl",
      icon: "w-4 h-4",
      label: "text-xs",
      sublabel: "text-[10px]",
    },
    lg: {
      container: "w-44 h-44",
      svgSize: 176,
      strokeWidth: 8,
      score: "text-6xl",
      icon: "w-5 h-5",
      label: "text-sm",
      sublabel: "text-xs",
    },
  };

  const sizes = sizeClasses[size];
  const radius = (sizes.svgSize - sizes.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center",
          sizes.container,
          config.bg,
          config.glow,
          "border",
          config.border
        )}
      >
        {/* SVG Ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={sizes.svgSize}
          height={sizes.svgSize}
        >
          {/* Background ring */}
          <circle
            cx={sizes.svgSize / 2}
            cy={sizes.svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={sizes.strokeWidth}
            className={config.ring}
          />
          {/* Progress ring */}
          <circle
            cx={sizes.svgSize / 2}
            cy={sizes.svgSize / 2}
            r={radius}
            fill="none"
            strokeWidth={sizes.strokeWidth}
            strokeLinecap="round"
            className={cn(config.ringFill, "transition-all duration-1000 ease-out")}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>

        {/* Rotating ring for high scores */}
        {score >= 7 && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-destructive/50 animate-radar opacity-60" />
            <div className="absolute inset-1 rounded-full border border-transparent border-t-destructive/30 animate-radar-slow opacity-40" />
          </>
        )}
        
        {/* Score display */}
        <div className="relative flex flex-col items-center justify-center">
          <span className={cn(
            "font-display font-bold leading-none",
            sizes.score,
            config.color,
            isAnimating && "animate-pulse"
          )}>
            {displayScore}
          </span>
          <span className={cn("font-mono text-muted-foreground mt-1", sizes.label === "text-xs" ? "text-[10px]" : "text-[8px]")}>
            /10
          </span>
        </div>

        {/* Sparkle effects for high scores */}
        {score >= 8 && (
          <>
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-warning animate-pulse" />
            <Zap className="absolute -bottom-1 -left-1 w-3 h-3 text-destructive animate-pulse" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>
      
      {/* Label section */}
      <div className={cn("flex flex-col items-center gap-1", config.color)}>
        <div className="flex items-center gap-1.5">
          <Icon className={sizes.icon} />
          <span className={cn("font-display uppercase tracking-widest", sizes.label)}>
            {config.label}
          </span>
        </div>
        {size !== "sm" && (
          <span className={cn("text-muted-foreground font-mono", sizes.sublabel)}>
            {config.sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
