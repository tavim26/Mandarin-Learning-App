import apiClient from './client';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
  PreviewResponseDto,
  AnalysisPageDto,
  AnalysisListParams,
} from '@/types';

export const analysisApi = {
  analyzeText: async (
    rawText: string,
    translationLanguage = 'en'
  ): Promise<TextAnalysisDto> => {
    const res = await apiClient.post<TextAnalysisDto>('/api/analysis/text', {
      raw_text: rawText,
      translation_language: translationLanguage,
    });
    return res.data;
  },

  analyzeOcr: async (
    image: File,
    translationLanguage = 'en'
  ): Promise<TextAnalysisDto> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('translation_language', translationLanguage);
    const res = await apiClient.post<TextAnalysisDto>(
      '/api/analysis/ocr',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  preview: async (text: string): Promise<PreviewResponseDto> => {
    const res = await apiClient.post<PreviewResponseDto>(
      '/api/analysis/preview',
      { text }
    );
    return res.data;
  },

  getStudentStats: async (studentId: number): Promise<StudentStatsDto> => {
    const res = await apiClient.get<StudentStatsDto>(
      `/api/analysis/student/${studentId}/stats`
    );
    return res.data;
  },

  getAnalysisList: async (
    studentId: number,
    params?: AnalysisListParams
  ): Promise<AnalysisPageDto<TextAnalysisSummaryDto>> => {
    const res = await apiClient.get<AnalysisPageDto<TextAnalysisSummaryDto>>(
      `/api/analysis/student/${studentId}`,
      { params }
    );
    return res.data;
  },

  getAnalysisById: async (analysisId: number): Promise<TextAnalysisDto> => {
    const res = await apiClient.get<TextAnalysisDto>(
      `/api/analysis/${analysisId}`
    );
    return res.data;
  },

  deleteAnalysis: async (analysisId: number): Promise<void> => {
    await apiClient.delete(`/api/analysis/${analysisId}`);
  },
};