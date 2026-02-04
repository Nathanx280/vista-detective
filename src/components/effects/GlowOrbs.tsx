import { cn } from "@/lib/utils";

interface GlowOrbsProps {
  className?: string;
}

export function GlowOrbs({ className }: GlowOrbsProps) {
  return (
    <div className={cn("fixed inset-0 overflow-hidden pointer-events-none", className)}>
      {/* Primary cyan orb - top left */}
      <div 
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(185 100% 55% / 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Purple mystery orb - top right */}
      <div 
        className="absolute -top-20 -right-40 w-[600px] h-[600px] rounded-full animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, hsl(280 85% 60% / 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animationDelay: '-2s',
        }}
      />
      
      {/* Red anomaly orb - bottom center */}
      <div 
        className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(0 90% 55% / 0.08) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animationDelay: '-4s',
        }}
      />

      {/* Subtle amber orb - bottom right */}
      <div 
        className="absolute -bottom-20 -right-20 w-[350px] h-[350px] rounded-full animate-float-delayed"
        style={{
          background: 'radial-gradient(circle, hsl(35 95% 55% / 0.1) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDelay: '-1s',
        }}
      />

      {/* Small accent orb - center left */}
      <div 
        className="absolute top-1/2 -left-20 w-[200px] h-[200px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(185 100% 55% / 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animationDelay: '-3s',
        }}
      />
    </div>
  );
}
