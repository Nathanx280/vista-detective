import { Discovery } from "@/types/discovery";
import { AnomalyScore } from "../AnomalyScore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Clock, Eye, Sparkles, Heart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoveryCardProps {
  discovery: Discovery;
  viewMode: 'grid' | 'list' | 'compact';
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onClick: () => void;
  index: number;
}

export function DiscoveryCard({
  discovery,
  viewMode,
  isFavorite,
  onToggleFavorite,
  onDelete,
  onClick,
  index,
}: DiscoveryCardProps) {
  const isComplete = discovery.status === 'complete';
  const isAnalyzing = discovery.status === 'analyzing';
  const isPending = discovery.status === 'pending';
  const isHighAnomaly = discovery.anomaly_score && discovery.anomaly_score >= 7;

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          "glass-panel overflow-hidden group cursor-pointer transition-all duration-300",
          "hover:border-primary/40",
          isComplete && "hover:ring-1 hover:ring-primary/30"
        )}
        onClick={onClick}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="flex items-center gap-4 p-3">
          {/* Thumbnail */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={discovery.image_url}
              alt="Discovery"
              className="w-full h-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            {discovery.anomaly_types && discovery.anomaly_types.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {discovery.anomaly_types.slice(0, 3).map((type, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
            {discovery.ai_analysis && (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {discovery.ai_analysis}
              </p>
            )}
            <p className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Score & Actions */}
          <div className="flex items-center gap-2">
            {isComplete && discovery.anomaly_score !== null && (
              <AnomalyScore score={discovery.anomaly_score} size="sm" animate={false} />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-destructive text-destructive")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div
        className={cn(
          "relative aspect-square rounded-lg overflow-hidden cursor-pointer group",
          "border border-border/30 hover:border-primary/50 transition-all"
        )}
        onClick={onClick}
      >
        <img
          src={discovery.image_url}
          alt="Discovery"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {isComplete && discovery.anomaly_score !== null && (
          <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              discovery.anomaly_score >= 7 && "bg-destructive text-destructive-foreground",
              discovery.anomaly_score >= 4 && discovery.anomaly_score < 7 && "bg-warning text-warning-foreground",
              discovery.anomaly_score < 4 && "bg-success text-success-foreground"
            )}>
              {discovery.anomaly_score}
            </div>
          </div>
        )}
        
        {isFavorite && (
          <div className="absolute top-1 right-1">
            <Heart className="w-4 h-4 fill-destructive text-destructive" />
          </div>
        )}
        
        {!isComplete && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Clock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    );
  }

  // Default grid view
  return (
    <Card
      className={cn(
        "glass-panel overflow-hidden group cursor-pointer transition-all duration-500",
        "hover:scale-[1.02] hover:border-primary/40",
        isComplete && "hover:ring-2 hover:ring-primary/30"
      )}
      onClick={onClick}
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
        {isAnalyzing && (
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
        {isPending && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 text-muted-foreground" />
              <span className="text-muted-foreground font-display text-xs tracking-widest">PENDING</span>
            </div>
          </div>
        )}

        {/* Score badge */}
        {isComplete && discovery.anomaly_score !== null && (
          <div className="absolute top-3 right-3 transform group-hover:scale-110 transition-transform duration-300">
            <AnomalyScore score={discovery.anomaly_score} size="sm" animate={false} />
          </div>
        )}

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute top-3 left-3 h-8 w-8 bg-background/50 hover:bg-background/70",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-destructive text-destructive")} />
        </Button>

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute bottom-3 left-3 h-8 w-8 bg-background/50 hover:bg-destructive/80",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* High score indicator */}
        {isHighAnomaly && (
          <div className="absolute top-12 left-3">
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
            {discovery.anomaly_types.slice(0, 3).map((type, i) => (
              <Badge
                key={i}
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
          <p className="text-sm text-muted-foreground line-clamp-2">
            {discovery.ai_analysis}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
          </p>
          {isComplete && (
            <span className="text-[10px] text-primary/60 flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              Click to view
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
