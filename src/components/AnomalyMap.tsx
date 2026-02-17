import { useEffect, useRef, useState } from "react";
import { Discovery } from "@/types/discovery";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Maximize2, Minimize2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AnomalyMapProps {
  discoveries: Discovery[];
  onSelectDiscovery?: (discovery: Discovery) => void;
  className?: string;
}

interface MapPoint {
  x: number;
  y: number;
  discovery: Discovery;
}

function hashToCoords(id: string): { lat: number; lng: number } {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) % 360;
    h2 = (h2 * 37 + id.charCodeAt(i)) % 180;
  }
  return { lat: h2 - 90, lng: h1 - 180 };
}

export function AnomalyMap({ discoveries, onSelectDiscovery, className }: AnomalyMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<MapPoint | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const animRef = useRef<number>();

  const completedDiscoveries = discoveries.filter(d => d.status === "complete");

  useEffect(() => {
    const newPoints = completedDiscoveries.map(d => {
      const coords = hashToCoords(d.id);
      return {
        x: ((coords.lng + 180) / 360),
        y: ((90 - coords.lat) / 180),
        discovery: d,
      };
    });
    setPoints(newPoints);
  }, [completedDiscoveries.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
    };
    resize();

    let time = 0;
    const animate = () => {
      time += 0.005;
      const w = canvas.width / 2;
      const h = canvas.height / 2;

      ctx.clearRect(0, 0, w, h);

      // Dark background
      ctx.fillStyle = "hsl(225, 25%, 3%)";
      ctx.fillRect(0, 0, w, h);

      // Grid lines (latitude/longitude)
      ctx.strokeStyle = "hsla(185, 100%, 55%, 0.06)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 12; i++) {
        const x = (i / 12) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const y = (i / 6) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Continent-like shapes (simplified silhouettes)
      ctx.fillStyle = "hsla(185, 100%, 55%, 0.04)";
      ctx.strokeStyle = "hsla(185, 100%, 55%, 0.12)";
      ctx.lineWidth = 1;

      // Simplified world outline shapes
      const drawLandmass = (px: number, py: number, pw: number, ph: number) => {
        ctx.beginPath();
        ctx.ellipse(px * w, py * h, pw * w * 0.5, ph * h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      };
      
      drawLandmass(0.25, 0.3, 0.12, 0.15); // NA
      drawLandmass(0.3, 0.55, 0.06, 0.18); // SA
      drawLandmass(0.5, 0.3, 0.08, 0.12); // Europe
      drawLandmass(0.52, 0.5, 0.07, 0.15); // Africa
      drawLandmass(0.65, 0.35, 0.15, 0.12); // Asia
      drawLandmass(0.8, 0.65, 0.06, 0.06); // Australia

      // Scanning line
      const scanX = ((Math.sin(time) + 1) / 2) * w;
      ctx.strokeStyle = "hsla(185, 100%, 55%, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, h);
      ctx.stroke();

      // Discovery points
      points.forEach((point, i) => {
        const px = point.x * w;
        const py = point.y * h;
        const score = point.discovery.anomaly_score || 0;

        // Pulse effect
        const pulse = Math.sin(time * 3 + i * 0.5) * 0.5 + 0.5;
        const baseRadius = 3 + score * 0.5;
        const radius = baseRadius + pulse * 2;

        // Glow
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius * 3);
        if (score >= 7) {
          gradient.addColorStop(0, `hsla(0, 90%, 55%, ${0.4 + pulse * 0.3})`);
          gradient.addColorStop(1, "hsla(0, 90%, 55%, 0)");
        } else if (score >= 4) {
          gradient.addColorStop(0, `hsla(35, 95%, 55%, ${0.3 + pulse * 0.2})`);
          gradient.addColorStop(1, "hsla(35, 95%, 55%, 0)");
        } else {
          gradient.addColorStop(0, `hsla(185, 100%, 55%, ${0.3 + pulse * 0.2})`);
          gradient.addColorStop(1, "hsla(185, 100%, 55%, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = score >= 7
          ? `hsla(0, 90%, 60%, ${0.8 + pulse * 0.2})`
          : score >= 4
            ? `hsla(35, 95%, 60%, ${0.8 + pulse * 0.2})`
            : `hsla(185, 100%, 60%, ${0.8 + pulse * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ring for high scores
        if (score >= 7) {
          ctx.strokeStyle = `hsla(0, 90%, 55%, ${0.3 + pulse * 0.3})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, radius * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Corner brackets
      ctx.strokeStyle = "hsla(185, 100%, 55%, 0.3)";
      ctx.lineWidth = 2;
      const bracketSize = 15;
      // TL
      ctx.beginPath(); ctx.moveTo(0, bracketSize); ctx.lineTo(0, 0); ctx.lineTo(bracketSize, 0); ctx.stroke();
      // TR
      ctx.beginPath(); ctx.moveTo(w - bracketSize, 0); ctx.lineTo(w, 0); ctx.lineTo(w, bracketSize); ctx.stroke();
      // BL
      ctx.beginPath(); ctx.moveTo(0, h - bracketSize); ctx.lineTo(0, h); ctx.lineTo(bracketSize, h); ctx.stroke();
      // BR
      ctx.beginPath(); ctx.moveTo(w - bracketSize, h); ctx.lineTo(w, h); ctx.lineTo(w, h - bracketSize); ctx.stroke();

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [points]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;

    let closest: MapPoint | null = null;
    let closestDist = 0.05;
    points.forEach(p => {
      const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
      if (dist < closestDist) {
        closest = p;
        closestDist = dist;
      }
    });

    if (closest && onSelectDiscovery) {
      onSelectDiscovery((closest as MapPoint).discovery);
    }
  };

  if (completedDiscoveries.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-widest text-muted-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          ANOMALY MAP
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
            <MapPin className="w-3 h-3 mr-1" />
            {completedDiscoveries.length} plotted
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "relative rounded-xl overflow-hidden border border-border/30 transition-all duration-500",
          expanded ? "h-[400px]" : "h-[200px]"
        )}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onClick={handleCanvasClick}
        />
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 glass-panel p-2 rounded-lg flex items-center gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Low
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" /> Med
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-destructive" /> High
          </span>
        </div>

        {/* Scan indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[9px] font-mono text-primary/60">LIVE TRACKING</span>
        </div>
      </div>
    </div>
  );
}
