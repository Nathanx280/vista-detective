import { cn } from "@/lib/utils";

interface GridOverlayProps {
  className?: string;
}

export function GridOverlay({ className }: GridOverlayProps) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Perspective grid floor effect */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[60vh] opacity-[0.03]"
        style={{
          background: `
            linear-gradient(90deg, hsl(185 100% 55%) 1px, transparent 1px),
            linear-gradient(0deg, hsl(185 100% 55%) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
        }}
      />
      
      {/* Vertical accent lines */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
        <div className="absolute left-2/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>

      {/* Horizontal scan lines */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: '20%',
            opacity: 0.05,
          }}
        />
        <div 
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: '40%',
            opacity: 0.03,
          }}
        />
        <div 
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: '60%',
            opacity: 0.04,
          }}
        />
        <div 
          className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          style={{
            top: '80%',
            opacity: 0.03,
          }}
        />
      </div>
    </div>
  );
}
