import { useState, useCallback } from 'react';
import { analysisApi, type NormalizedPage, type GetAnalysesParams } from '@/api/analysisApi';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
} from '@/types/analysis';

export const useAnalysis = (studentId: number) => {
  const [result, setResult]               = useState<TextAnalysisDto | null>(null);
  const [history, setHistory]             = useState<NormalizedPage<TextAnalysisSummaryDto> | null>(null);
  const [stats, setStats]                 = useState<StudentStatsDto | null>(null);
  const [loading, setLoading]             = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading]   = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const analyze = useCallback(async (
    rawText: string,
    language: 'ro' | 'en' = 'ro'
  ): Promise<TextAnalysisDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await analysisApi.analyzeText({ raw_text: rawText, translation_language: language });
      setResult(data);
      return data;
    } catch (err) {
      setError('Analiza textului a esuat.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeImage = useCallback(async (
    image: File,
    language: 'ro' | 'en' = 'ro'
  ): Promise<TextAnalysisDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await analysisApi.analyzeOcr(image, language);
      setResult(data);
      return data;
    } catch (err) {
      setError('Analiza imaginii a esuat.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (params: GetAnalysesParams = {}) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const data = await analysisApi.getStudentAnalyses(studentId, params);
      setHistory(data);
    } catch (err) {
      setError('Incarcarea istoricului a esuat.');
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  }, [studentId]);

  const fetchById = useCallback(async (
    analysisId: number
  ): Promise<TextAnalysisDto | null> => {
    try {
      return await analysisApi.getAnalysisById(analysisId);
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (analysisId: number): Promise<void> => {
    try {
      await analysisApi.deleteAnalysis(analysisId);
      // Actualizeaza lista locala optimist dupa stergere reusita
      setHistory((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter((a) => a.id !== analysisId),
          total: prev.total - 1,
        };
      });
    } catch (err) {
      setError('Stergerea analizei a esuat.');
      throw err;
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setError(null);
    try {
      const data = await analysisApi.getStudentStats(studentId);
      setStats(data);
    } catch (err) {
      setError('Incarcarea statisticilor a esuat.');
      throw err;
    } finally {
      setStatsLoading(false);
    }
  }, [studentId]);

  const clearResult = useCallback(() => setResult(null), []);
  const clearError  = useCallback(() => setError(null), []);

  return {
    result,
    history,
    stats,
    loading,
    historyLoading,
    statsLoading,
    error,
    analyze,
    analyzeImage,
    fetchHistory,
    fetchById,
    remove,
    fetchStats,
    clearResult,
    clearError,
  };
};