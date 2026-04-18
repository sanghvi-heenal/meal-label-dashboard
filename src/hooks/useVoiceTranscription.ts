import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
 * - Auto-detects support; `supported` is false on Firefox and other unsupported browsers.
 * - Auto-stops after 3s of silence or 60s hard cap.
 * - Defaults language to the browser locale; override via `lang`.
 */
export function useVoiceTranscription(opts?: { lang?: string }) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accRef = useRef<string>("");

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    silenceTimerRef.current = null;
    maxTimerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setIsListening(false);
  }, [clearTimers]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => stop(), 3000);
  }, [stop]);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    if (isListening) {
      stop();
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = opts?.lang || navigator.language || "en-US";
    recognitionRef.current = recognition;
    accRef.current = transcript;

    recognition.onresult = (event: any) => {
      resetSilenceTimer();
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accRef.current += (accRef.current ? " " : "") + text;
          setTranscript(accRef.current);
        }
      }
    };

    recognition.onerror = () => {
      clearTimers();
      setIsListening(false);
    };

    recognition.onend = () => {
      clearTimers();
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
    resetSilenceTimer();
    maxTimerRef.current = setTimeout(() => stop(), 60000);
  }, [isListening, opts?.lang, transcript, resetSilenceTimer, clearTimers, stop]);

  const reset = useCallback(() => {
    accRef.current = "";
    setTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, [clearTimers]);

  return { transcript, setTranscript, isListening, supported, start, stop, reset };
}
