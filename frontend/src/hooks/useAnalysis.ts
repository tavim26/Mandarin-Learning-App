import { useState, useCallback } from 'react';
import { analysisApi } from '@/api/analysisApi';
import { useAuthStore } from '@/store/authStore';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
  PreviewResponseDto,
  AnalysisPageDto,
  AnalysisListParams,
  TranslationLanguage,
} from '@/types';

export type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  AnalysisTokenDto,
  StudentStatsDto,
  PreviewResponseDto,
  PreviewTokenDto,
  SourceType,
  TranslationLanguage,
  AnalysisListParams,
  TokenDistributionDto,
  UniqueCharsPerHskDto,
} from '@/types';

export const useAnalysis = () => {
  const { userId } = useAuthStore();

  const [analysisList, setAnalysisList] =
    useState<AnalysisPageDto<TextAnalysisSummaryDto> | null>(null);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<TextAnalysisDto | null>(null);
  const [stats, setStats] = useState<StudentStatsDto | null>(null);
  const [preview, setPreview] = useState<PreviewResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchList = useCallback(
    async (params?: AnalysisListParams) => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await analysisApi.getAnalysisList(userId, params);
        setAnalysisList(data);
      } catch {
        setError('Nu s-a putut incarca lista de analize.');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );


  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await analysisApi.getStudentStats(userId);
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [userId]);




  const fetchAnalysisById = useCallback(async (analysisId: number) => {
  if (analysisId === 0) {
    setCurrentAnalysis(null);
    return;
  }
  setIsLoading(true);
  setError(null);
  try {
    const data = await analysisApi.getAnalysisById(analysisId);
    setCurrentAnalysis(data);
  } catch {
    setError('Analysis could not be loaded.');
  } finally {
    setIsLoading(false);
  }
}, []);





  const analyzeText = async (
    rawText: string,
    language: TranslationLanguage = 'en'
  ): Promise<TextAnalysisDto | null> => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analysisApi.analyzeText(rawText, language);
      setCurrentAnalysis(result);
      
      setAnalysisList(null);
      return result;
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setError('Translation service is currently not available.');
      } else {
        setError('Text analyze failed.');
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };


  const analyzeOcr = async (
    image: File,
    language: TranslationLanguage = 'en'
  ): Promise<TextAnalysisDto | null> => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analysisApi.analyzeOcr(image, language);
      setCurrentAnalysis(result);
      setAnalysisList(null);
      return result;
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        setError('Image does not contain detectable chinese text.');
      } else if (status === 503) {
        setError('Translation service is currently not available.');
      } else {
        setError('Image analyze failed');
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };



  const previewText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsPreviewing(true);
    try {
      const data = await analysisApi.preview(text);
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setIsPreviewing(false);
    }
  }, []);

  const deleteAnalysis = async (analysisId: number): Promise<boolean> => {
    try {
      await analysisApi.deleteAnalysis(analysisId);
      setAnalysisList((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((a) => a.id !== analysisId),
              total: prev.total - 1,
            }
          : prev
      );
      if (currentAnalysis?.id === analysisId) {
        setCurrentAnalysis(null);
      }
      return true;
    } catch {
      setError('Analyze deletion has failed.');
      return false;
    }
  };

  
  return {
    analysisList,
    currentAnalysis,
    stats,
    preview,
    isLoading,
    isAnalyzing,
    isPreviewing,
    error,
    fetchList,
    fetchStats,
    fetchAnalysisById,
    analyzeText,
    analyzeOcr,
    previewText,
    deleteAnalysis,
  };
};