import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
            "relative flex flex-col items-center justify-center w-full h-80 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-grid-pattern bg-[size:30px_30px]" />
          </div>

          {/* Scanning line effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 animate-scan" />

          <div className="relative z-10 flex flex-col items-center gap-4 p-8">
            <div className={cn(
              "p-5 rounded-full bg-gradient-to-br from-muted to-secondary transition-all duration-300",
              isDragging ? "scale-110 animate-pulse-glow" : "group-hover:scale-105"
            )}>
              {isDragging ? (
                <Globe className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-primary" />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="font-display text-xl text-foreground tracking-wide">
                {isDragging ? "Drop to Analyze" : "Upload Satellite Image"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                Drag & drop a Google Earth screenshot or click to browse
              </p>
            </div>

            <label>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInput}
                disabled={isAnalyzing}
              />
              <Button 
                variant="outline" 
                className="mt-2 border-primary/50 hover:bg-primary hover:text-primary-foreground transition-all"
                asChild
              >
                <span>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Select Image
                </span>
              </Button>
            </label>
          </div>

          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
        </div>
      ) : (
        <div className="relative w-full rounded-2xl overflow-hidden glass-panel">
          <img
            src={preview}
            alt="Uploaded satellite image"
            className="w-full h-80 object-cover"
          />
          
          {/* Overlay when analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/30" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-radar" />
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="font-display text-primary animate-pulse">SCANNING FOR ANOMALIES...</p>
            </div>
          )}

          {/* Clear button */}
          {!isAnalyzing && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-4 right-4"
              onClick={clearPreview}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}