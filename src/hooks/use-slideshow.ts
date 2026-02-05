import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSlideshowProps {
  enabled: boolean;
  interval?: number;
  onNext: () => void;
  onComplete?: () => void;
  itemCount: number;
  currentIndex: number;
}

export function useSlideshow({
  enabled,
  interval = 5000,
  onNext,
  onComplete,
  itemCount,
  currentIndex,
}: UseSlideshowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!enabled || itemCount <= 1) return;
    setIsPlaying(true);
    setProgress(0);

    // Progress animation
    const progressStep = 100 / (interval / 100);
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + progressStep;
      });
    }, 100);

    // Slide change
    intervalRef.current = setInterval(() => {
      setProgress(0);
      if (currentIndex >= itemCount - 1) {
        onComplete?.();
        stop();
      } else {
        onNext();
      }
    }, interval);
  }, [enabled, interval, onNext, onComplete, itemCount, currentIndex, stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Cleanup on unmount or when disabled
  useEffect(() => {
    if (!enabled) {
      stop();
    }
    return () => stop();
  }, [enabled, stop]);

  // Reset progress when index changes externally
  useEffect(() => {
    if (isPlaying) {
      setProgress(0);
    }
  }, [currentIndex, isPlaying]);

  return {
    isPlaying,
    progress,
    start,
    stop,
    toggle,
  };
}
