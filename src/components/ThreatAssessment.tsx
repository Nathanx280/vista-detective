import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Eye, Radio, Scan } from "lucide-react";

interface ThreatAssessmentProps {
  score: number;
  anomalyTypes?: string[];
  mysteryLevel?: string;
}

const THREAT_CATEGORIES = [
  { label: "STRUCTURAL", icon: Shield, key: "structural" },
  { label: "THERMAL", icon: Radio, key: "thermal" },
  { label: "PATTERN", icon: Scan, key: "pattern" },
  { label: "SHADOW", icon: Eye, key: "shadow" },
  { label: "GEOLOGICAL", icon: AlertTriangle, key: "geological" },
];

export function ThreatAssessment({ score, anomalyTypes = [], mysteryLevel }: ThreatAssessmentProps) {
  // Derive category scores from anomaly types and overall score
  const getCategoryScore = (key: string): number => {
    const typeMatches: Record<string, string[]> = {
      structural: ["structural", "geometric", "symmetry", "rectangular", "straight", "shape"],
      thermal: ["thermal", "color", "discoloration", "temperature", "heat"],
      pattern: ["pattern", "repetitive", "grid", "repeating", "regular"],
      shadow: ["shadow", "depth", "hidden", "dark", "obscured"],
      geological: ["geological", "terrain", "underwater", "formation", "landscape"],
    };
    
    const matches = typeMatches[key] || [];
    const typeStr = anomalyTypes.join(" ").toLowerCase();
    const matchCount = matches.filter(m => typeStr.includes(m)).length;
    const baseScore = (score / 10) * 60;
    const bonus = matchCount * 15;
    return Math.min(100, Math.round(baseScore + bonus + Math.random() * 10));
  };

  return (
    <div className="space-y-3">
      <h4 className="font-display text-xs tracking-widest text-muted-foreground flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-destructive" />
        THREAT ASSESSMENT
      </h4>
      
      <div className="space-y-2">
        {THREAT_CATEGORIES.map((cat, i) => {
          const value = getCategoryScore(cat.key);
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="flex items-center gap-3">
              <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground w-20 flex-shrink-0">
                {cat.label}
              </span>
              <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    value >= 70 ? "bg-destructive" : value >= 40 ? "bg-warning" : "bg-primary"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                />
              </div>
              <span className={cn(
                "text-[10px] font-mono w-8 text-right",
                value >= 70 ? "text-destructive" : value >= 40 ? "text-warning" : "text-primary"
              )}>
                {value}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
