import { useState, useCallback, useRef } from 'react';

// Text-to-Speech pentru pronuntia caracterelor chinezesti.
// Foloseste Web Speech API nativa — fara dependente externe.
export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
  (text: string, lang = 'zh-CN') => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();

    setTimeout(() => {
      // Scoate engine-ul din suspended state (Chromium bug — Edge & Chrome)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);
  },
  [isSupported]
);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
};