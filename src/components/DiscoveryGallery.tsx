import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AnomalyScore } from "./AnomalyScore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

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
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-2xl text-primary">Recent Discoveries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!discoveries || discoveries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No discoveries yet. Upload an image to start!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-primary flex items-center gap-3">
        <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
        Recent Discoveries
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {discoveries.map((discovery) => (
          <Card key={discovery.id} className="glass-panel overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className="relative h-48">
              <img
                src={discovery.image_url}
                alt="Discovery"
                className="w-full h-full object-cover"
              />
              
              {/* Status overlay */}
              {discovery.status === "analyzing" && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-primary font-display text-sm">ANALYZING...</span>
                  </div>
                </div>
              )}

              {discovery.status === "complete" && discovery.anomaly_score !== null && (
                <div className="absolute top-3 right-3">
                  <AnomalyScore score={discovery.anomaly_score} size="sm" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
            </div>

            <CardContent className="p-4 space-y-3">
              {discovery.anomaly_types && discovery.anomaly_types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {discovery.anomaly_types.slice(0, 3).map((type, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs border-primary/30 text-primary/80"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              )}

              {discovery.ai_analysis && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {discovery.ai_analysis}
                </p>
              )}

              <p className="text-xs text-muted-foreground/60">
                {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}