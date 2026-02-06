import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

interface UsePremiumTTSOptions {
  voiceId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Premium voice options from ElevenLabs
export const PREMIUM_VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Deep & authoritative" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Warm & natural" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "British narrator" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Clear & friendly" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Calm & professional" },
] as const;

export function usePremiumTTS(options: UsePremiumTTSOptions = {}) {
  const { voiceId = "JBFqnCBsd6RMkjVDRZzb", onStart, onEnd, onError } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text) {
      toast.error("No text to speak");
      return null;
    }

    // Stop any existing playback
    stop();
    
    setIsLoading(true);
    setError(null);

    // Create Audio element immediately in user gesture context
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    try {
      abortControllerRef.current = new AbortController();

      console.log("Fetching premium TTS audio...");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audio.src = audioUrl;
      
      audio.onloadeddata = () => {
        console.log("Audio loaded, playing...");
        setIsLoading(false);
        setIsPlaying(true);
        onStart?.();
        audio.play().catch(err => {
          console.error("Play error:", err);
          setError("Failed to play audio");
          onError?.("Failed to play audio");
        });
      };

      audio.onended = () => {
        console.log("Audio ended");
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = (e) => {
        console.error("Audio error:", e);
        setIsPlaying(false);
        setIsLoading(false);
        setError("Audio playback error");
        onError?.("Audio playback error");
      };

      return audio;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("TTS request aborted");
        return null;
      }
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("TTS error:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
      toast.error("Premium voice failed", {
        description: "Falling back to browser speech",
      });
      return null;
    }
  }, [voiceId, stop, onStart, onEnd, onError]);

  const toggle = useCallback(async (text: string) => {
    if (isPlaying || isLoading) {
      stop();
      return null;
    }
    return speak(text);
  }, [isPlaying, isLoading, speak, stop]);

  return {
    speak,
    stop,
    toggle,
    isLoading,
    isPlaying,
    error,
    audioElement: audioRef.current,
  };
}
