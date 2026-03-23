import { useCallback, useEffect, useState } from 'react';

interface UseTTSReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

const useTTS = (lang = 'zh-CN'): UseTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => { if (isSupported) window.speechSynthesis.cancel(); };
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isSupported, lang]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
};

export default useTTS;