import { Satellite, Radar, Eye, Sparkles, Zap, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <header className={cn("text-center space-y-8 py-8 md:py-12", className)}>
      {/* Logo & Title */}
      <div className="space-y-6">
        {/* Animated logo icon */}
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Outer glow rings */}
            <div className="absolute inset-0 w-20 h-20 -m-2 rounded-full border border-primary/20 animate-pulse" />
            <div className="absolute inset-0 w-24 h-24 -m-4 rounded-full border border-primary/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
            
            {/* Main icon container */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-mystery/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
              <Satellite className="w-8 h-8 text-primary" />
              
              {/* Radar sweep */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div 
                  className="absolute inset-0 animate-radar"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, hsl(185 100% 55% / 0.3) 30deg, transparent 60deg)',
                  }}
                />
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -left-3 w-1.5 h-1.5 bg-mystery rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-wider leading-tight">
            <span className="text-gradient">EARTH ANOMALY</span>
            <br />
            <span className="text-foreground">DETECTOR</span>
          </h1>
          
          {/* Subtitle with typing effect appearance */}
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Upload satellite imagery. AI scans for unexplained patterns.
            <br className="hidden sm:block" />
            Generate viral mystery content automatically.
          </p>
        </div>
      </div>

      {/* Feature badges */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <FeatureBadge icon={Eye} label="AI Vision Analysis" />
        <FeatureBadge icon={Radar} label="Anomaly Detection" />
        <FeatureBadge icon={Sparkles} label="Auto Narration" />
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-4">
        <StatItem value="0-10" label="Anomaly Scale" icon={Zap} />
        <StatItem value="AI" label="Powered Vision" icon={Globe} />
        <StatItem value="100%" label="Automated" icon={Shield} />
      </div>
    </header>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all duration-300 group cursor-default">
      <Icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
      <span className="text-muted-foreground text-sm font-medium">{label}</span>
    </div>
  );
}

function StatItem({ value, label, icon: Icon }: { value: string; label: string; icon: typeof Zap }) {
  return (
    <div className="flex items-center gap-3 group">
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:border-primary/40 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="text-left">
        <p className="font-display text-lg text-foreground tracking-wide">{value}</p>
        <p className="text-xs text-muted-foreground font-mono">{label}</p>
      </div>
    </div>
  );
}
