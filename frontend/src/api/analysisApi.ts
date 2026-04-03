import apiClient from './client';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
  PageDto,
  AnalyzeTextRequest,
  PreviewRequest,
  PreviewResponse,
  SourceType,
  TranslationLanguage,
} from '@/types';

export const previewText = async (text: string): Promise<PreviewResponse> => {
  const response = await apiClient.post<PreviewResponse>('/api/analysis/preview', {
    text,
  } satisfies PreviewRequest);
  return response.data;
};

export const analyzeText = async (
  rawText: string,
  translationLanguage: TranslationLanguage = 'ro'
): Promise<TextAnalysisDto> => {
  const response = await apiClient.post<TextAnalysisDto>('/api/analysis/text', {
    raw_text: rawText,
    translation_language: translationLanguage,
  } satisfies AnalyzeTextRequest);
  return response.data;
};

export const analyzeOcr = async (
  image: File,
  translationLanguage: TranslationLanguage = 'ro'
): Promise<TextAnalysisDto> => {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('translation_language', translationLanguage);
  const response = await apiClient.post<TextAnalysisDto>('/api/analysis/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getAnalysisHistory = async (
  studentId: number,
  params: {
    page?: number;
    size?: number;
    source_type?: SourceType;
    hsk_level?: number;
    sort_order?: 'newest' | 'oldest';
  } = {}
): Promise<PageDto<TextAnalysisSummaryDto>> => {
  const response = await apiClient.get<PageDto<TextAnalysisSummaryDto>>(
    `/api/analysis/student/${studentId}`,
    { params }
  );
  return response.data;
};

export const getAnalysisById = async (analysisId: number): Promise<TextAnalysisDto> => {
  const response = await apiClient.get<TextAnalysisDto>(`/api/analysis/${analysisId}`);
  return response.data;
};

export const deleteAnalysis = async (analysisId: number): Promise<void> => {
  await apiClient.delete(`/api/analysis/${analysisId}`);
};

export const getStudentStats = async (studentId: number): Promise<StudentStatsDto> => {
  const response = await apiClient.get<StudentStatsDto>(
    `/api/analysis/student/${studentId}/stats`
  );
  return response.data;
};