import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, Download, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AnomalyArtGeneratorProps {
  discoveryId?: string;
  analysisText?: string;
  anomalyTypes?: string[];
  anomalyScore?: number;
  onArtGenerated?: () => void;
}

export function AnomalyArtGenerator({
  discoveryId,
  analysisText,
  anomalyTypes,
  anomalyScore,
  onArtGenerated,
}: AnomalyArtGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [artUrl, setArtUrl] = useState<string | null>(null);

  const generateArt = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-anomaly-art", {
        body: {
          discoveryId,
          analysisText,
          anomalyTypes,
          anomalyScore,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setArtUrl(data.imageUrl);
      onArtGenerated?.();
      toast.success("🎨 AI Art Generated!", {
        description: "Your anomaly has been artistically interpreted",
      });
    } catch (err) {
      console.error("Art generation error:", err);
      toast.error("Art generation failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadArt = () => {
    if (!artUrl) return;
    const a = document.createElement("a");
    a.href = artUrl;
    a.download = `anomaly-art-${discoveryId?.slice(0, 8) || "unknown"}.png`;
    a.click();
    toast.success("Art downloaded!");
  };

  return (
    <Card className="glass-panel border-mystery/20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-mystery/5 via-transparent to-primary/5 pointer-events-none" />
      
      <CardHeader className="pb-3 relative">
        <CardTitle className="font-display text-sm tracking-widest flex items-center gap-2 text-mystery">
          <Wand2 className="w-4 h-4" />
          AI ANOMALY ART
        </CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <AnimatePresence mode="wait">
          {artUrl ? (
            <motion.div
              key="art"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <div className="relative rounded-xl overflow-hidden border border-mystery/30">
                <img
                  src={artUrl}
                  alt="AI-generated anomaly art"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent pointer-events-none" />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadArt}
                  className="flex-1 border-mystery/30 hover:border-mystery font-display tracking-wider text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  DOWNLOAD
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setArtUrl(null); generateArt(); }}
                  className="border-primary/30 hover:border-primary font-display tracking-wider text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  REGENERATE
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={generateArt}
                disabled={isGenerating}
                className={cn(
                  "w-full font-display tracking-wider",
                  "bg-gradient-to-r from-mystery to-primary text-primary-foreground",
                  "hover:from-mystery/90 hover:to-primary/90",
                  "shadow-[0_0_20px_hsl(280_85%_60%_/_0.3)]",
                  "hover:shadow-[0_0_35px_hsl(280_85%_60%_/_0.5)]"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    GENERATING VISION...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    GENERATE AI ART
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground/50 font-mono text-center mt-2">
                Creates an artistic AI interpretation of this anomaly
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
