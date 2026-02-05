import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResult } from "@/components/AnalysisResult";
import { DiscoveryGallery } from "@/components/DiscoveryGallery";
import { HeroSection } from "@/components/HeroSection";
import { ParticleField } from "@/components/effects/ParticleField";
import { GlowOrbs } from "@/components/effects/GlowOrbs";
import { GridOverlay } from "@/components/effects/GridOverlay";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Radar, Zap, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleImageSelect = (imageData: string) => {
    setCurrentImage(imageData);
    setAnalysisResult(null);
  };

  const analyzeImage = async () => {
    if (!currentImage) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // First, create a discovery record
      const { data: discovery, error: insertError } = await supabase
        .from("discoveries")
        .insert({
          image_url: currentImage,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the analyze edge function
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: {
          imageUrl: currentImage,
          discoveryId: discovery.id,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult({
        analysis: data.analysis,
        narration: data.narration,
      });

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
      {/* Background effects */}
      <ParticleField />
      <GlowOrbs />
      <GridOverlay />
      <div className="noise-overlay" />
      <div className="scanline opacity-20" />

      {/* Hero gradient overlay */}
      <div 
        className="fixed inset-x-0 top-0 h-[50vh] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(185 100% 55% / 0.08), transparent)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        {/* Header */}
        <HeroSection />

        {/* Main Content */}
        <main className="space-y-12 md:space-y-16">
          {/* Upload Section */}
          <section className="glass-panel p-4 md:p-8 rounded-2xl relative overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-xs tracking-wider uppercase">Upload Module</span>
            </div>

            <ImageUploader 
              onImageSelect={handleImageSelect} 
              isAnalyzing={isAnalyzing}
            />

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
                    "btn-primary-glow",
                    "transition-all duration-300"
                  )}
                >
                  <Radar className="w-5 h-5 mr-3 animate-pulse" />
                  SCAN FOR ANOMALIES
                  <Zap className="w-4 h-4 ml-3" />
                </Button>
              </div>
            )}
          </section>

          {/* Analysis Results */}
          {analysisResult && (
            <section className="glass-panel-glow p-4 md:p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Section header */}
              <div className="flex items-center gap-2 mb-6 text-destructive">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                <span className="font-mono text-xs tracking-wider uppercase">Analysis Results</span>
              </div>

              <AnalysisResult
                analysis={analysisResult.analysis}
                narration={analysisResult.narration}
                imageUrl={currentImage || undefined}
              />
            </section>
          )}

          {/* Discovery Gallery */}
          <section className="glass-panel p-4 md:p-8 rounded-2xl">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-xs tracking-wider uppercase">Discovery Archive</span>
            </div>
            
            <DiscoveryGallery onImportImage={handleImageSelect} />
          </section>
        </main>

        {/* Footer */}
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
