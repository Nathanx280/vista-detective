import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
  className?: string;
  barCount?: number;
  variant?: "bars" | "wave" | "circle";
}

export function AudioVisualizer({ 
  isPlaying, 
  audioElement,
  className,
  barCount = 32,
  variant = "bars"
}: AudioVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isPlaying || !audioElement) {
      // Generate fake animation when no real audio
      if (isPlaying) {
        const fakeAnimate = () => {
          setLevels(prev => 
            prev.map((_, i) => {
              const base = Math.sin(Date.now() / 200 + i * 0.5) * 0.3 + 0.5;
              const noise = Math.random() * 0.3;
              return Math.min(1, Math.max(0.1, base + noise));
            })
          );
          animationRef.current = requestAnimationFrame(fakeAnimate);
        };
        fakeAnimate();
      } else {
        setLevels(Array(barCount).fill(0));
      }
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }

    // Real audio analysis
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const audioContext = audioContextRef.current;
      
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 64;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);
      }

      const analyser = analyserRef.current!;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);
        const newLevels = Array.from({ length: barCount }, (_, i) => {
          const index = Math.floor((i / barCount) * dataArray.length);
          return dataArray[index] / 255;
        });
        setLevels(newLevels);
        animationRef.current = requestAnimationFrame(animate);
      };
      animate();
    } catch (error) {
      console.error("Audio visualization error:", error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, audioElement, barCount]);

  if (variant === "wave") {
    return (
      <div className={cn("flex items-center justify-center gap-[2px] h-12", className)}>
        {levels.map((level, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-primary to-primary/50"
            animate={{
              height: isPlaying ? `${Math.max(4, level * 48)}px` : "4px",
              opacity: isPlaying ? 0.6 + level * 0.4 : 0.3,
            }}
            transition={{ duration: 0.05 }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
    return (
      <div className={cn("relative flex items-center justify-center", className)}>
        <motion.div
          className="absolute rounded-full bg-primary/20"
          animate={{
            scale: isPlaying ? 1 + avgLevel * 0.5 : 1,
            opacity: isPlaying ? 0.3 + avgLevel * 0.3 : 0.1,
          }}
          style={{ width: "100%", height: "100%" }}
        />
        <motion.div
          className="absolute rounded-full bg-primary/40"
          animate={{
            scale: isPlaying ? 1 + avgLevel * 0.3 : 1,
            opacity: isPlaying ? 0.4 + avgLevel * 0.3 : 0.2,
          }}
          style={{ width: "80%", height: "80%" }}
        />
        <motion.div
          className="absolute rounded-full bg-primary/60"
          animate={{
            scale: isPlaying ? 1 + avgLevel * 0.15 : 1,
            opacity: isPlaying ? 0.5 + avgLevel * 0.3 : 0.3,
          }}
          style={{ width: "60%", height: "60%" }}
        />
      </div>
    );
  }

  // Default bars variant
  return (
    <div className={cn("flex items-end justify-center gap-[3px] h-16", className)}>
      {levels.map((level, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-t-sm bg-gradient-to-t from-destructive via-warning to-primary"
          animate={{
            height: isPlaying ? `${Math.max(4, level * 64)}px` : "4px",
            opacity: isPlaying ? 0.7 + level * 0.3 : 0.2,
          }}
          transition={{ duration: 0.05 }}
        />
      ))}
    </div>
  );
}
