import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResult } from "@/components/AnalysisResult";
import { DiscoveryGallery } from "@/components/DiscoveryGallery";
import { HeroSection } from "@/components/HeroSection";
import { MissionPanel } from "@/components/MissionPanel";
import { AnomalyMap } from "@/components/AnomalyMap";
import { AnomalyArtGenerator } from "@/components/AnomalyArtGenerator";
import { ThreatAssessment } from "@/components/ThreatAssessment";
import { ParticleField } from "@/components/effects/ParticleField";
import { GlowOrbs } from "@/components/effects/GlowOrbs";
import { GridOverlay } from "@/components/effects/GridOverlay";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Radar, Zap, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissions } from "@/hooks/use-missions";
import { useQuery } from "@tanstack/react-query";
import { Discovery } from "@/types/discovery";
import { motion, AnimatePresence } from "framer-motion";

interface AnalysisData {
  anomaly_score: number;
  anomaly_types: string[];
  analysis: string;
  mystery_level?: string;
  coordinates_estimate?: string;
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: AnalysisData;
    narration: string;
  } | null>(null);
  const [currentDiscoveryId, setCurrentDiscoveryId] = useState<string | null>(null);

  const { progress, rank, recordScan, recordArtGeneration, recordFavorite } = useMissions();

  // Fetch discoveries for the map
  const { data: mapDiscoveries = [] } = useQuery({
    queryKey: ["discoveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discoveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Discovery[];
    },
    refetchInterval: 5000,
  });

  const handleImageSelect = (imageData: string) => {
    setCurrentImage(imageData);
    setAnalysisResult(null);
    setCurrentDiscoveryId(null);
  };

  const analyzeImage = async () => {
    if (!currentImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const { data: discovery, error: insertError } = await supabase
        .from("discoveries")
        .insert({ image_url: currentImage, status: "pending" })
        .select()
        .single();

      if (insertError) throw insertError;
      setCurrentDiscoveryId(discovery.id);

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl: currentImage, discoveryId: discovery.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysisResult({ analysis: data.analysis, narration: data.narration });
      recordScan(data.analysis.anomaly_score);

      const scoreEmoji = data.analysis.anomaly_score >= 7 ? "🔴" : data.analysis.anomaly_score >= 5 ? "🟡" : "🟢";
      toast.success(`${scoreEmoji} Analysis Complete!`, {
        description: `Anomaly score: ${data.analysis.anomaly_score}/10 - ${data.analysis.mystery_level || 'Unknown'} mystery level`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleField />
      <GlowOrbs />
      <GridOverlay />
      <div className="noise-overlay" />
      <div className="scanline opacity-20" />

      <div 
        className="fixed inset-x-0 top-0 h-[50vh] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(185 100% 55% / 0.08), transparent)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        <HeroSection />

        <main className="space-y-12 md:space-y-16">
          {/* Agent Status / Mission Panel */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <MissionPanel progress={progress} rank={rank} />
          </motion.section>

          {/* Upload Section */}
          <motion.section
            className="glass-panel p-4 md:p-8 rounded-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-xs tracking-wider uppercase">Upload Module</span>
            </div>

            <ImageUploader onImageSelect={handleImageSelect} isAnalyzing={isAnalyzing} />

            {currentImage && !isAnalyzing && !analysisResult && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <ArrowDown className="w-5 h-5 text-muted-foreground animate-bounce" />
                <Button
                  size="lg"
                  onClick={analyzeImage}
                  className={cn(
                    "font-display tracking-widest text-base md:text-lg px-8 md:px-12 py-6 md:py-7 rounded-xl",
                    "bg-gradient-to-r from-primary via-primary to-primary/80",
                    "hover:from-primary/90 hover:via-primary hover:to-primary/70",
                    "btn-primary-glow transition-all duration-300"
                  )}
                >
                  <Radar className="w-5 h-5 mr-3 animate-pulse" />
                  SCAN FOR ANOMALIES
                  <Zap className="w-4 h-4 ml-3" />
                </Button>
              </div>
            )}
          </motion.section>

          {/* Analysis Results */}
          <AnimatePresence>
            {analysisResult && (
              <motion.section
                className="space-y-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.7 }}
              >
                <div className="glass-panel-glow p-4 md:p-8 rounded-2xl">
                  <div className="flex items-center gap-2 mb-6 text-destructive">
                    <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                    <span className="font-mono text-xs tracking-wider uppercase">Analysis Results</span>
                  </div>

                  <AnalysisResult
                    analysis={analysisResult.analysis}
                    narration={analysisResult.narration}
                    imageUrl={currentImage || undefined}
                  />
                </div>

                {/* Threat Assessment + AI Art side by side */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-panel p-4 md:p-6 rounded-2xl">
                    <ThreatAssessment
                      score={analysisResult.analysis.anomaly_score}
                      anomalyTypes={analysisResult.analysis.anomaly_types}
                      mysteryLevel={analysisResult.analysis.mystery_level}
                    />
                  </div>

                  <AnomalyArtGenerator
                    discoveryId={currentDiscoveryId || undefined}
                    analysisText={analysisResult.analysis.analysis}
                    anomalyTypes={analysisResult.analysis.anomaly_types}
                    anomalyScore={analysisResult.analysis.anomaly_score}
                    onArtGenerated={recordArtGeneration}
                  />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Anomaly Map */}
          {mapDiscoveries.length > 0 && (
            <motion.section
              className="glass-panel p-4 md:p-8 rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnomalyMap discoveries={mapDiscoveries} />
            </motion.section>
          )}

          {/* Discovery Gallery */}
          <motion.section
            className="glass-panel p-4 md:p-8 rounded-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-xs tracking-wider uppercase">Discovery Archive</span>
            </div>
            
            <DiscoveryGallery onImportImage={handleImageSelect} />
          </motion.section>
        </main>

        <footer className="mt-16 md:mt-24 py-8 text-center border-t border-border/30">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground/60 font-mono">
              For entertainment purposes only • Not affiliated with Google Earth
            </p>
            <p className="text-xs text-muted-foreground/40">
              Powered by AI Vision Analysis
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
