import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, Zap, Flame, Star, Target, ChevronDown, ChevronUp, 
  Award, TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  UserProgress, BADGES, getRank, getXPProgress, getLevel
} from "@/hooks/use-missions";

interface MissionPanelProps {
  progress: UserProgress;
  rank: string;
}

export function MissionPanel({ progress, rank }: MissionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const xpProgress = getXPProgress(progress.xp);

  return (
    <Card className="glass-panel-glow border-mystery/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-mystery/5 via-transparent to-primary/5 pointer-events-none" />
      
      <CardHeader className="pb-3 relative">
        <CardTitle className="font-display text-base tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-2 text-mystery">
            <div className="w-2 h-2 bg-mystery rounded-full animate-pulse" />
            AGENT STATUS
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 px-2"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Level & Rank Bar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center font-display text-2xl font-bold",
              "bg-gradient-to-br from-mystery/20 to-primary/20 border border-mystery/30",
              progress.level >= 10 && "mystery-glow"
            )}>
              {progress.level}
            </div>
            {progress.streak >= 3 && (
              <div className="absolute -top-1 -right-1 flex items-center">
                <Flame className="w-4 h-4 text-warning animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm tracking-wider text-mystery">{rank}</span>
              <span className="font-mono text-xs text-muted-foreground">{progress.xp} XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>LVL {progress.level}</span>
              <span>{Math.round(xpProgress)}% to LVL {progress.level + 1}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Scans", value: progress.totalScans, icon: Target },
            { label: "Streak", value: `${progress.streak}🔥`, icon: Flame },
            { label: "High", value: progress.highScoreCount, icon: TrendingUp },
            { label: "Art", value: progress.artGenerated, icon: Star },
          ].map(stat => (
            <div key={stat.label} className="glass-panel p-2 rounded-lg text-center">
              <p className="font-display text-sm font-bold">{stat.value}</p>
              <p className="text-[9px] text-muted-foreground font-mono uppercase">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-2">
                <h4 className="font-display text-xs tracking-widest text-muted-foreground flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  BADGES ({progress.badges.length}/{BADGES.length})
                </h4>
                
                <div className="grid grid-cols-5 gap-2">
                  {BADGES.map(badge => {
                    const earned = progress.badges.includes(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={cn(
                          "relative group flex flex-col items-center p-2 rounded-lg transition-all",
                          earned
                            ? "glass-panel border-primary/30"
                            : "bg-muted/20 border border-border/20 opacity-40"
                        )}
                        title={`${badge.name}: ${badge.description}`}
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-[8px] font-mono text-muted-foreground mt-1 text-center leading-tight">
                          {badge.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* XP Breakdown */}
                <div className="glass-panel p-3 rounded-lg space-y-1">
                  <h4 className="font-display text-[10px] tracking-widest text-muted-foreground">XP REWARDS</h4>
                  <div className="grid grid-cols-2 gap-x-4 text-[10px] font-mono text-muted-foreground">
                    <span>Scan: +25 XP</span>
                    <span>High Score (7+): +15 XP</span>
                    <span>Extreme (9+): +25 XP</span>
                    <span>AI Art: +15 XP</span>
                    <span>Favorite: +5 XP</span>
                    <span>Badge: +50 XP</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
