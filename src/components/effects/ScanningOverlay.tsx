import { cn } from "@/lib/utils";

interface ScanningOverlayProps {
  isActive?: boolean;
  className?: string;
}

export function ScanningOverlay({ isActive = false, className }: ScanningOverlayProps) {
  if (!isActive) return null;

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden rounded-2xl", className)}>
      {/* Moving scan line */}
      <div 
        className="absolute left-0 right-0 h-1 animate-scan-move"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(185 100% 55%), transparent)',
          boxShadow: '0 0 20px hsl(185 100% 55% / 0.5), 0 0 40px hsl(185 100% 55% / 0.3)',
        }}
      />

      {/* Corner targeting brackets */}
      <div className="absolute top-4 left-4 w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-pulse" />
        <div className="absolute top-0 left-0 w-0.5 h-full bg-primary animate-pulse" />
      </div>
      <div className="absolute top-4 right-4 w-8 h-8">
        <div className="absolute top-0 right-0 w-full h-0.5 bg-primary animate-pulse" />
        <div className="absolute top-0 right-0 w-0.5 h-full bg-primary animate-pulse" />
      </div>
      <div className="absolute bottom-4 left-4 w-8 h-8">
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-pulse" />
        <div className="absolute bottom-0 left-0 w-0.5 h-full bg-primary animate-pulse" />
      </div>
      <div className="absolute bottom-4 right-4 w-8 h-8">
        <div className="absolute bottom-0 right-0 w-full h-0.5 bg-primary animate-pulse" />
        <div className="absolute bottom-0 right-0 w-0.5 h-full bg-primary animate-pulse" />
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(185 100% 55% / 0.2) 1px, transparent 1px),
            linear-gradient(0deg, hsl(185 100% 55% / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, hsl(185 100% 55% / 0.1) 100%)',
        }}
      />
    </div>
  );
}
