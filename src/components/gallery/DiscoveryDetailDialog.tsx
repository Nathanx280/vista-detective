import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AnomalyScore } from "../AnomalyScore";
import { AudioVisualizer } from "../effects/AudioVisualizer";
import { Discovery } from "@/types/discovery";
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";
import { useSlideshow } from "@/hooks/use-slideshow";
import { usePremiumTTS, PREMIUM_VOICES } from "@/hooks/use-premium-tts";
import { formatDistanceToNow } from "date-fns";
import { 
  Download, Copy, Share2, Volume2, VolumeX, X, MapPin, Clock,
  Heart, Trash2, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight,
  Play, Pause, Maximize2, FileJson, Printer, Link2, Keyboard, Loader2, Mic
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiscoveryDetailDialogProps {
  discovery: Discovery | null;
  discoveries: Discovery[];
  currentIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function DiscoveryDetailDialog({ 
  discovery, 
  discoveries,
  currentIndex,
  open, 
  onOpenChange,
  onNavigate,
  isFavorite,
  onToggleFavorite,
  onDelete,
}: DiscoveryDetailDialogProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>(PREMIUM_VOICES[0].id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const { speak, stop: stopTTS, isLoading: isTTSLoading, isPlaying: isSpeaking, audioElement } = usePremiumTTS({
    voiceId: selectedVoice,
    onEnd: () => console.log("TTS playback ended"),
  });

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < discoveries.length - 1;

  const handleNext = useCallback(() => {
    if (canNavigateNext) {
      onNavigate(currentIndex + 1);
      resetZoom();
    }
  }, [canNavigateNext, currentIndex, onNavigate]);

  const handlePrevious = useCallback(() => {
    if (canNavigatePrev) {
      onNavigate(currentIndex - 1);
      resetZoom();
    }
  }, [canNavigatePrev, currentIndex, onNavigate]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const { isPlaying, progress, toggle: toggleSlideshow } = useSlideshow({
    enabled: open,
    interval: 5000,
    onNext: handleNext,
    itemCount: discoveries.length,
    currentIndex,
  });

  useKeyboardNavigation({
    enabled: open,
    onNext: handleNext,
    onPrevious: handlePrevious,
    onClose: () => onOpenChange(false),
    onToggleFavorite,
    onDownload: () => discovery && handleDownloadImage(),
    onShare: () => discovery && handleShare(),
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: resetZoom,
    onToggleSlideshow: toggleSlideshow,
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      resetZoom();
      stopTTS();
    }
  }, [open, resetZoom, stopTTS]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  if (!discovery) return null;

  const handleCopyNarration = () => {
    if (discovery.narration) {
      navigator.clipboard.writeText(discovery.narration);
      toast.success("Narration copied to clipboard!");
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?discovery=${discovery.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
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
    } catch {
      toast.error("Failed to download image");
    }
  };

  const handleExportJSON = () => {
    const data = {
      id: discovery.id,
      anomaly_score: discovery.anomaly_score,
      anomaly_types: discovery.anomaly_types,
      analysis: discovery.ai_analysis,
      narration: discovery.narration,
      location: discovery.location_hint,
      created_at: discovery.created_at,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomaly-${discovery.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON!");
  };

  const handlePrint = () => {
    const printContent = `
      ANOMALY REPORT
      ==============
      
      Score: ${discovery.anomaly_score}/10
      Types: ${discovery.anomaly_types?.join(', ') || 'Unknown'}
      Location: ${discovery.location_hint || 'Unknown'}
      Date: ${new Date(discovery.created_at).toLocaleString()}
      
      ANALYSIS
      --------
      ${discovery.ai_analysis || 'No analysis available'}
      
      NARRATION
      ---------
      ${discovery.narration || 'No narration available'}
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<pre style="font-family: monospace; padding: 20px;">${printContent}</pre>`);
      win.document.close();
      win.print();
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
      } catch {
        navigator.clipboard.writeText(shareText);
        toast.success("Content copied to clipboard!");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Content copied to clipboard!");
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking || isTTSLoading) {
      stopTTS();
      return;
    }

    const text = discovery.narration || discovery.ai_analysis;
    if (!text) {
      toast.error("No text to speak");
      return;
    }

    await speak(text);
  };

  const handleToggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDeleteWithConfirm = () => {
    if (confirm('Are you sure you want to delete this discovery?')) {
      onDelete();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[98vw] max-h-[98vh] overflow-hidden p-0 bg-card/95 backdrop-blur-xl border-primary/20">
        {/* Slideshow progress */}
        {isPlaying && (
          <div className="absolute top-0 left-0 right-0 z-50">
            <Progress value={progress} className="h-1 rounded-none" />
          </div>
        )}

        <div className="grid md:grid-cols-[1fr,380px] h-full max-h-[98vh]">
          {/* Image Section */}
          <div 
            ref={imageRef}
            className="relative bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px] overflow-hidden select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={discovery.id}
                src={discovery.image_url}
                alt="Discovery"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                draggable={false}
              />
            </AnimatePresence>
            
            {/* Score overlay */}
            {discovery.anomaly_score !== null && (
              <div className="absolute top-4 right-4">
                <AnomalyScore score={discovery.anomaly_score} size="lg" animate />
              </div>
            )}

            {/* Navigation arrows */}
            {canNavigatePrev && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/50 hover:bg-background/70"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}
            {canNavigateNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/50 hover:bg-background/70"
                onClick={handleNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Top controls */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/50 hover:bg-background/70"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-5 h-5" />
              </Button>
              
              <span className="text-xs font-mono text-foreground/70 bg-background/50 px-2 py-1 rounded">
                {currentIndex + 1} / {discoveries.length}
              </span>
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-background/50 rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} disabled={zoom <= 1}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} disabled={zoom >= 5}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetZoom} disabled={zoom === 1}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Bottom right controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/50 hover:bg-background/70"
                      onClick={toggleSlideshow}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Slideshow (Space)</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/50 hover:bg-background/70"
                      onClick={handleToggleFullscreen}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fullscreen</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-background/50 hover:bg-background/70"
                      onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                    >
                      <Keyboard className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Keyboard shortcuts</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Keyboard help overlay */}
            {showKeyboardHelp && (
              <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-50">
                <div className="glass-panel p-6 rounded-xl max-w-sm">
                  <h3 className="font-display text-lg mb-4">Keyboard Shortcuts</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex justify-between"><span>←/→</span><span>Navigate</span></div>
                    <div className="flex justify-between"><span>+/-</span><span>Zoom</span></div>
                    <div className="flex justify-between"><span>0</span><span>Reset zoom</span></div>
                    <div className="flex justify-between"><span>Space</span><span>Slideshow</span></div>
                    <div className="flex justify-between"><span>F</span><span>Favorite</span></div>
                    <div className="flex justify-between"><span>D</span><span>Download</span></div>
                    <div className="flex justify-between"><span>S</span><span>Share</span></div>
                    <div className="flex justify-between"><span>Esc</span><span>Close</span></div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={() => setShowKeyboardHelp(false)}
                  >
                    Got it
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 overflow-y-auto max-h-[50vh] md:max-h-[98vh] space-y-5 border-l border-border/30">
            {/* Header with favorite & delete */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                ANOMALY REPORT
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant={isFavorite ? "default" : "ghost"}
                  size="icon"
                  className={cn("h-8 w-8", isFavorite && "bg-destructive hover:bg-destructive/90")}
                  onClick={onToggleFavorite}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleDeleteWithConfirm}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

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

            {/* Narration with Premium TTS */}
            {discovery.narration && (
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-3 h-3" />
                  Mystery Narration
                </h4>
                <div className="relative glass-panel p-4 rounded-lg border-l-2 border-primary/50">
                  <p className="text-sm italic text-foreground/80 leading-relaxed">
                    "{discovery.narration}"
                  </p>
                </div>
                
                {/* Audio Visualizer */}
                {(isSpeaking || isTTSLoading) && (
                  <div className="glass-panel p-3 rounded-lg">
                    <AudioVisualizer 
                      isPlaying={isSpeaking} 
                      audioElement={audioElement}
                      barCount={24}
                      variant="bars"
                    />
                  </div>
                )}

                {/* Voice Selector & Play Button */}
                <div className="flex items-center gap-2">
                  <Select value={selectedVoice} onValueChange={setSelectedVoice} disabled={isSpeaking || isTTSLoading}>
                    <SelectTrigger className="flex-1 h-9 text-xs">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREMIUM_VOICES.map(voice => (
                        <SelectItem key={voice.id} value={voice.id} className="text-xs">
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-muted-foreground ml-1">- {voice.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={isSpeaking ? "destructive" : "default"}
                    size="sm"
                    onClick={handleSpeak}
                    disabled={isTTSLoading}
                    className="gap-2 min-w-[100px]"
                  >
                    {isTTSLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading
                      </>
                    ) : isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Listen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={handleDownloadImage} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyNarration} disabled={!discovery.narration} className="gap-2">
                <Copy className="w-4 h-4" />
                Copy Text
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-2">
                <FileJson className="w-4 h-4" />
                Export JSON
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
                <Link2 className="w-3.5 h-3.5" />
                Copy Link
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportJSON} className="gap-1.5 text-xs">
                <FileJson className="w-3.5 h-3.5" />
                Export
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
