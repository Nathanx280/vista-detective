import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnomalyScore } from "./AnomalyScore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Clock, Eye, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Discovery {
  id: string;
  image_url: string;
  anomaly_score: number | null;
  anomaly_types: string[] | null;
  ai_analysis: string | null;
  narration: string | null;
  status: string | null;
  created_at: string;
}

export function DiscoveryGallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const { data: discoveries, isLoading } = useQuery({
    queryKey: ["discoveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discoveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Discovery[];
    },
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl md:text-2xl text-foreground tracking-wide flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            RECENT DISCOVERIES
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-52 rounded-xl bg-muted/50" />
              <Skeleton className="h-4 w-3/4 bg-muted/30" />
              <Skeleton className="h-3 w-1/2 bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!discoveries || discoveries.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted/30">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-lg text-foreground">NO DISCOVERIES YET</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Upload your first satellite image to begin uncovering Earth's mysteries
            </p>
          </div>
        </div>
      </div>
    );
  }

  const completedDiscoveries = discoveries.filter(d => d.status === "complete");
  const pendingDiscoveries = discoveries.filter(d => d.status !== "complete");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl md:text-2xl text-foreground tracking-wide flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          RECENT DISCOVERIES
          <Badge variant="outline" className="border-primary/30 text-primary/70 font-mono text-xs ml-2">
            {completedDiscoveries.length} analyzed
          </Badge>
        </h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {discoveries.map((discovery, index) => (
          <Card 
            key={discovery.id} 
            className={cn(
              "glass-panel overflow-hidden group cursor-pointer transition-all duration-500",
              "hover:scale-[1.02] hover:border-primary/40",
              selectedId === discovery.id && "ring-2 ring-primary/50"
            )}
            onClick={() => setSelectedId(selectedId === discovery.id ? null : discovery.id)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-48 md:h-52 overflow-hidden">
              <img
                src={discovery.image_url}
                alt="Discovery"
                className={cn(
                  "w-full h-full object-cover transition-all duration-700",
                  "group-hover:scale-110"
                )}
              />
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              
              {/* Status overlay for analyzing */}
              {discovery.status === "analyzing" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30" />
                      <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-primary animate-radar" />
                      <Loader2 className="absolute inset-0 m-auto w-5 h-5 text-primary animate-spin" />
                    </div>
                    <span className="text-primary font-display text-xs tracking-widest">ANALYZING...</span>
                  </div>
                </div>
              )}

              {/* Pending status */}
              {discovery.status === "pending" && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                    <span className="text-muted-foreground font-display text-xs tracking-widest">PENDING</span>
                  </div>
                </div>
              )}

              {/* Score badge */}
              {discovery.status === "complete" && discovery.anomaly_score !== null && (
                <div className="absolute top-3 right-3 transform group-hover:scale-110 transition-transform duration-300">
                  <AnomalyScore score={discovery.anomaly_score} size="sm" animate={false} />
                </div>
              )}

              {/* High score indicator */}
              {discovery.anomaly_score && discovery.anomaly_score >= 7 && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-destructive/90 text-destructive-foreground font-display text-xs animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    HIGH ANOMALY
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Anomaly type badges */}
              {discovery.anomaly_types && discovery.anomaly_types.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {discovery.anomaly_types.slice(0, 3).map((type, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-[10px] border-primary/20 text-primary/70 font-mono"
                    >
                      {type}
                    </Badge>
                  ))}
                  {discovery.anomaly_types.length > 3 && (
                    <Badge variant="outline" className="text-[10px] border-muted-foreground/20 text-muted-foreground">
                      +{discovery.anomaly_types.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Analysis preview */}
              {discovery.ai_analysis && (
                <p className={cn(
                  "text-sm text-muted-foreground transition-all duration-300",
                  selectedId === discovery.id ? "line-clamp-none" : "line-clamp-2"
                )}>
                  {discovery.ai_analysis}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
                </p>
                <ChevronRight className={cn(
                  "w-4 h-4 text-muted-foreground/30 transition-transform duration-300",
                  selectedId === discovery.id && "rotate-90"
                )} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
