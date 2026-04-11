import { useState, useCallback } from 'react';
import { analysisApi } from '@/api/analysisApi';
import type { PreviewTokenDto } from '@/types';

export const useChinesePreview = () => {
  const [tokens, setTokens] = useState<PreviewTokenDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPreview = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const result = await analysisApi.preview(text);
      setTokens(
        result.tokens.sort((a, b) => a.position_index - b.position_index)
      );
    } catch {
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { tokens, isLoading, fetchPreview };
};

export type { PreviewTokenDto };