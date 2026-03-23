import { useState, useRef, useCallback, useEffect } from "react";

interface UseTextToSpeechReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    // Try to pick a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel"))
    ) || voices.find((v) => v.lang.startsWith("en") && v.localService === false) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => { setIsPlaying(false); setIsPaused(false); utteranceRef.current = null; };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); utteranceRef.current = null; };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [isSupported, stop]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  useEffect(() => {
    return () => { if (isSupported) window.speechSynthesis.cancel(); };
  }, [isSupported]);

  return { isPlaying, isPaused, isSupported, speak, pause, resume, stop };
}
