import { useState } from 'react';
import {
  analyzeText,
  analyzeOcr,
  previewText,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getStudentStats,
} from '@/api/analysisApi';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
  PageDto,
  SourceType,
  TranslationLanguage,
} from '@/types';

export const useAnalysis = (studentId: number) => {
  const [result, setResult] = useState<TextAnalysisDto | null>(null);
  const [history, setHistory] = useState<PageDto<TextAnalysisSummaryDto> | null>(null);
  const [stats, setStats] = useState<StudentStatsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    rawText: string,
    language: TranslationLanguage = 'ro'
  ): Promise<TextAnalysisDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeText(rawText, language);
      setResult(data);
      return data;
    } catch {
      setError('Failed to analyze text.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const analyzeImage = async (
    image: File,
    language: TranslationLanguage = 'ro'
  ): Promise<TextAnalysisDto> => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeOcr(image, language);
      setResult(data);
      return data;
    } catch {
      setError('Failed to analyze image.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const preview = async (text: string) => {
    try {
      return await previewText(text);
    } catch {
      return null;
    }
  };

  const fetchHistory = async (params: {
    page?: number;
    size?: number;
    source_type?: SourceType;
    hsk_level?: number;
    sort_order?: 'newest' | 'oldest';
  } = {}) => {
    setHistoryLoading(true);
    try {
      const data = await getAnalysisHistory(studentId, params);
      setHistory(data);
    } catch {
      setError('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchById = async (analysisId: number): Promise<TextAnalysisDto | null> => {
    try {
      return await getAnalysisById(analysisId);
    } catch {
      return null;
    }
  };

  const remove = async (analysisId: number): Promise<void> => {
    await deleteAnalysis(analysisId);
    if (history) {
      setHistory({
        ...history,
        items: history.items.filter((a) => a.id !== analysisId),
        total: history.total - 1,
      });
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await getStudentStats(studentId);
      setStats(data);
    } catch {
      setError('Failed to load stats.');
    } finally {
      setStatsLoading(false);
    }
  };

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
    preview,
    fetchHistory,
    fetchById,
    remove,
    fetchStats,
  };
};