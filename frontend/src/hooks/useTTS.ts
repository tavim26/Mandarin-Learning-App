import { useState, useCallback, useRef } from 'react';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = useCallback((text: string, lang = 'zh-CN') => {
    if (!isSupported) return;

    // Anuleaza orice timeout pending — previne race conditions la click rapid
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    window.speechSynthesis.cancel();

    timeoutRef.current = setTimeout(() => {
      // Resume neconditional — scoate engine-ul din orice stare suspendata
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        timeoutRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        timeoutRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 200);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
};