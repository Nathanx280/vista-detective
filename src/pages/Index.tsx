import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResult } from "@/components/AnalysisResult";
import { DiscoveryGallery } from "@/components/DiscoveryGallery";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Satellite, Radar, Eye, Sparkles } from "lucide-react";

interface AnalysisData {
  anomaly_score: number;
  anomaly_types: string[];
  analysis: string;
  mystery_level?: string;
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

      toast.success("Analysis complete!", {
        description: `Anomaly score: ${data.analysis.anomaly_score}/10`,
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
      <div className="noise-overlay" />
      <div className="scanline opacity-30" />
      
      {/* Animated gradient orbs */}
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-float pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-96 h-96 bg-destructive/10 rounded-full blur-[120px] animate-float pointer-events-none" style={{ animationDelay: "-1.5s" }} />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Satellite className="w-12 h-12 text-primary" />
              <div className="absolute inset-0 w-12 h-12 text-primary blur-lg opacity-50" />
            </div>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-wider">
            <span className="text-gradient">EARTH ANOMALY</span>
            <br />
            <span className="text-foreground">DETECTOR</span>
          </h1>
          
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Upload Google Earth screenshots. AI analyzes for anomalies. 
            Generate viral mystery content automatically.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">AI Vision Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm">
              <Radar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Anomaly Detection</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Auto Narration</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-12">
          {/* Upload Section */}
          <section className="glass-panel p-6 md:p-8 rounded-2xl">
            <ImageUploader 
              onImageSelect={handleImageSelect} 
              isAnalyzing={isAnalyzing}
            />

            {currentImage && !isAnalyzing && !analysisResult && (
              <div className="mt-6 flex justify-center">
                <Button
                  size="lg"
                  onClick={analyzeImage}
                  className="font-display tracking-wider text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 glow-border"
                >
                  <Radar className="w-5 h-5 mr-2 animate-pulse" />
                  SCAN FOR ANOMALIES
                </Button>
              </div>
            )}
          </section>

          {/* Analysis Results */}
          {analysisResult && (
            <section className="glass-panel p-6 md:p-8 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <AnalysisResult
                analysis={analysisResult.analysis}
                narration={analysisResult.narration}
                imageUrl={currentImage || undefined}
              />
            </section>
          )}

          {/* Discovery Gallery */}
          <section>
            <DiscoveryGallery />
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground/60">
          <p>For entertainment purposes only. Not affiliated with Google Earth.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;