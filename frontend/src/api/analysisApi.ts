import apiClient from './client';

export interface PreviewTokenDto {
  hanzi: string;
  pinyin: string | null;
  hsk_level: number | null;
  position_index: number;
}

export interface TextPreviewDto {
  tokens: PreviewTokenDto[];
}

export interface AnalysisTokenDto {
  id: number;
  analysis_id: number;
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  hsk_level: number | null;
  position_index: number;
}

export interface TextAnalysisDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: 'MANUAL' | 'OCR';
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string | null;
  translation_language: string;
  tokens: AnalysisTokenDto[];
}

export interface TextAnalysisSummaryDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: 'MANUAL' | 'OCR';
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string | null;
  translation_language: string;
}

export interface PageDto {
  items: TextAnalysisSummaryDto[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface TokenDistributionDto {
  hsk_level: number | null;
  token_count: number;
}

export interface UniqueCharsDto {
  hsk_level: number;
  unique_count: number;
  total_in_level: number;
  percentage: number;
}

export interface StudentStatsDto {
  token_distribution: TokenDistributionDto[];
  source_type_split: { MANUAL: number; OCR: number };
  unique_chars_per_hsk_level: UniqueCharsDto[];
}

export const previewText = async (text: string): Promise<TextPreviewDto> => {
  const response = await apiClient.post<TextPreviewDto>('/api/analysis/preview', { text });
  return response.data;
};

export const analyzeText = async (
  rawText: string,
  translationLanguage = 'ro'
): Promise<TextAnalysisDto> => {
  const response = await apiClient.post<TextAnalysisDto>('/api/analysis/text', {
    raw_text: rawText,
    translation_language: translationLanguage,
  });
  return response.data;
};

export const analyzeOcr = async (
  image: File,
  translationLanguage = 'ro'
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
    source_type?: 'MANUAL' | 'OCR';
    hsk_level?: number;
    sort_order?: 'newest' | 'oldest';
  } = {}
): Promise<PageDto> => {
  const response = await apiClient.get<PageDto>(`/api/analysis/student/${studentId}`, { params });
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