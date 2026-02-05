import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnomalyScore } from "./AnomalyScore";
import { formatDistanceToNow } from "date-fns";
import { Download, Copy, Share2, Volume2, VolumeX, X, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Discovery {
  id: string;
  image_url: string;
  anomaly_score: number | null;
  anomaly_types: string[] | null;
  ai_analysis: string | null;
  narration: string | null;
  status: string | null;
  created_at: string;
  location_hint?: string | null;
}

interface DiscoveryDetailDialogProps {
  discovery: Discovery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscoveryDetailDialog({ discovery, open, onOpenChange }: DiscoveryDetailDialogProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!discovery) return null;

  const handleCopyNarration = () => {
    if (discovery.narration) {
      navigator.clipboard.writeText(discovery.narration);
      toast.success("Narration copied to clipboard!");
    }
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(discovery.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `anomaly-${discovery.id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const handleShare = async () => {
    const shareText = `🛸 Anomaly Score: ${discovery.anomaly_score}/10\n\n${discovery.narration || discovery.ai_analysis || "Check out this mysterious discovery!"}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Earth Anomaly Discovery",
          text: shareText,
        });
      } catch (error) {
        navigator.clipboard.writeText(shareText);
        toast.success("Content copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Content copied to clipboard!");
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = discovery.narration || discovery.ai_analysis;
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-card/95 backdrop-blur-xl border-primary/20">
        <div className="grid md:grid-cols-2 h-full max-h-[95vh]">
          {/* Image Section */}
          <div className="relative bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
            <img
              src={discovery.image_url}
              alt="Discovery"
              className="w-full h-full object-contain"
            />
            
            {/* Score overlay */}
            {discovery.anomaly_score !== null && (
              <div className="absolute top-4 right-4">
                <AnomalyScore score={discovery.anomaly_score} size="lg" animate />
              </div>
            )}

            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 left-2 md:hidden bg-black/50 hover:bg-black/70"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Details Section */}
          <div className="p-6 overflow-y-auto max-h-[50vh] md:max-h-[95vh] space-y-6">
            <DialogHeader>
              <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                ANOMALY REPORT
              </DialogTitle>
            </DialogHeader>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(discovery.created_at), { addSuffix: true })}
              </div>
              {discovery.location_hint && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {discovery.location_hint}
                </div>
              )}
            </div>

            {/* Anomaly Types */}
            {discovery.anomaly_types && discovery.anomaly_types.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Detected Anomalies</h4>
                <div className="flex flex-wrap gap-2">
                  {discovery.anomaly_types.map((type, i) => (
                    <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis */}
            {discovery.ai_analysis && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">AI Analysis</h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {discovery.ai_analysis}
                </p>
              </div>
            )}

            {/* Narration */}
            {discovery.narration && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Mystery Narration</h4>
                <div className="relative glass-panel p-4 rounded-lg border-l-2 border-primary/50">
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    "{discovery.narration}"
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadImage}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyNarration}
                disabled={!discovery.narration}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant={isSpeaking ? "destructive" : "outline"}
                size="sm"
                onClick={handleSpeak}
                disabled={!discovery.narration && !discovery.ai_analysis}
                className="gap-2"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                {isSpeaking ? "Stop" : "Listen"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
