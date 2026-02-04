import { useState, useCallback } from "react";
import { Upload, Globe, Loader2, X, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScanningOverlay } from "./effects/ScanningOverlay";

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
  isAnalyzing: boolean;
}

export function ImageUploader({ onImageSelect, isAnalyzing }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  return (
    <div className="w-full">
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative flex flex-col items-center justify-center w-full min-h-[320px] md:min-h-[380px] rounded-2xl border-2 border-dashed transition-all duration-500 cursor-pointer group overflow-hidden",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
          )}
        >
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, hsl(185 100% 55% / 0.1) 1px, transparent 1px),
                  linear-gradient(0deg, hsl(185 100% 55% / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          {/* Scanning line effect on hover/drag */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent transition-opacity duration-300",
            isDragging ? "opacity-100 animate-scan" : "opacity-0 group-hover:opacity-60 group-hover:animate-scan"
          )} />

          {/* Corner decorations with glow */}
          <div className="absolute top-3 left-3 w-10 h-10">
            <div className={cn(
              "absolute top-0 left-0 w-full h-[2px] transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
            <div className={cn(
              "absolute top-0 left-0 w-[2px] h-full transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
          </div>
          <div className="absolute top-3 right-3 w-10 h-10">
            <div className={cn(
              "absolute top-0 right-0 w-full h-[2px] transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
            <div className={cn(
              "absolute top-0 right-0 w-[2px] h-full transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
          </div>
          <div className="absolute bottom-3 left-3 w-10 h-10">
            <div className={cn(
              "absolute bottom-0 left-0 w-full h-[2px] transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
            <div className={cn(
              "absolute bottom-0 left-0 w-[2px] h-full transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
          </div>
          <div className="absolute bottom-3 right-3 w-10 h-10">
            <div className={cn(
              "absolute bottom-0 right-0 w-full h-[2px] transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
            <div className={cn(
              "absolute bottom-0 right-0 w-[2px] h-full transition-all duration-300",
              isDragging ? "bg-primary shadow-[0_0_10px_hsl(185_100%_55%)]" : "bg-primary/40 group-hover:bg-primary/70"
            )} />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 p-8">
            {/* Animated icon container */}
            <div className={cn(
              "relative p-6 rounded-2xl transition-all duration-500",
              isDragging 
                ? "bg-primary/20 scale-110" 
                : "bg-gradient-to-br from-muted/80 to-secondary/80 group-hover:scale-105"
            )}>
              {/* Pulsing ring */}
              <div className={cn(
                "absolute inset-0 rounded-2xl border-2 border-primary/30 transition-opacity duration-300",
                isDragging ? "opacity-100 animate-pulse" : "opacity-0 group-hover:opacity-50"
              )} />
              
              {isDragging ? (
                <Globe className="w-12 h-12 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              ) : (
                <Upload className="w-12 h-12 text-primary transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="font-display text-xl md:text-2xl text-foreground tracking-wide">
                {isDragging ? (
                  <span className="text-primary animate-pulse">DROP TO ANALYZE</span>
                ) : (
                  "UPLOAD SATELLITE IMAGE"
                )}
              </h3>
              <p className="text-muted-foreground text-sm md:text-base max-w-sm leading-relaxed">
                Drag & drop a Google Earth screenshot or click to browse your files
              </p>
            </div>

            <label className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
                disabled={isAnalyzing}
              />
              <Button 
                variant="outline" 
                size="lg"
                className="mt-2 border-primary/40 hover:border-primary hover:bg-primary/10 transition-all duration-300 font-display tracking-wider btn-primary-glow"
                asChild
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  SELECT IMAGE
                </span>
              </Button>
            </label>

            {/* Supported formats hint */}
            <p className="text-xs text-muted-foreground/50 font-mono">
              JPEG • PNG • WEBP
            </p>
          </div>
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden glass-panel group">
          <img
            src={preview}
            alt="Uploaded satellite image"
            className={cn(
              "w-full min-h-[320px] md:min-h-[400px] object-cover transition-all duration-500",
              isAnalyzing && "scale-105 blur-[2px]"
            )}
          />
          
          {/* Scanning overlay when analyzing */}
          <ScanningOverlay isActive={isAnalyzing} />
          
          {/* Overlay when analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center gap-6">
              {/* Radar animation */}
              <div className="relative">
                <div className="w-28 h-28 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 w-28 h-28 rounded-full border-2 border-transparent border-t-primary animate-radar" />
                <div className="absolute inset-2 w-24 h-24 rounded-full border border-primary/10" />
                <div className="absolute inset-4 w-20 h-20 rounded-full border border-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                
                {/* Ping effect */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              
              <div className="text-center space-y-2">
                <p className="font-display text-xl text-primary animate-pulse tracking-widest">
                  SCANNING FOR ANOMALIES
                </p>
                <div className="flex items-center gap-2 justify-center text-muted-foreground text-sm font-mono">
                  <Zap className="w-3 h-3 text-warning animate-pulse" />
                  <span>AI Vision Processing...</span>
                </div>
              </div>
            </div>
          )}

          {/* Clear button with better styling */}
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full shadow-lg"
              onClick={clearPreview}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  );
}
