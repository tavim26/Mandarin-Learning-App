import apiClient from '@/api/client';
import type {
  TextAnalysisDto,
  TextAnalysisSummaryDto,
  StudentStatsDto,
  AnalyzeTextRequestDto,
} from '@/types/analysis';

// PageDto cu items de tip T — reflecta raspunsul paginat al analysis-service
interface AnalysisPageDto<T> {
  items: T[];
  total: number;
  page: number;       // base-1 — returnat de Python service
  size: number;
  total_pages: number;
}

// Raspuns normalizat catre base-0 — consistent cu restul serviciilor Java
export interface NormalizedPage<T> {
  items: T[];
  total: number;
  page: number;       // base-0
  size: number;
  totalPages: number;
}

// Singurul loc din codebase unde se face conversia base-1 → base-0.
// analysis-service returneaza page cu indexare base-1 (Python/FastAPI),
// spre deosebire de toate serviciile Java care folosesc base-0.
function normalizeAnalysisPage<T>(dto: AnalysisPageDto<T>): NormalizedPage<T> {
  return {
    items:      dto.items,
    total:      dto.total,
    page:       dto.page - 1,
    size:       dto.size,
    totalPages: dto.total_pages,
  };
}

// Conversia inversa: frontend trimite page base-0, service asteapta base-1
function toAnalysisPage(page: number): number {
  return page + 1;
}

export interface GetAnalysesParams {
  page?: number;        // base-0 — conventia frontend
  size?: number;
  sourceType?: 'MANUAL' | 'OCR';
  hskLevel?: number;
  sortOrder?: 'newest' | 'oldest';
}

export const analysisApi = {
  analyzeText: async (payload: AnalyzeTextRequestDto): Promise<TextAnalysisDto> => {
    const { data } = await apiClient.post<TextAnalysisDto>(
      '/api/analysis/text',
      payload
    );
    return data;
  },

  analyzeOcr: async (
    image: File,
    translationLanguage: 'ro' | 'en' = 'en'
  ): Promise<TextAnalysisDto> => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('translation_language', translationLanguage);

    const { data } = await apiClient.post<TextAnalysisDto>(
      '/api/analysis/ocr',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  getAnalysisById: async (analysisId: number): Promise<TextAnalysisDto> => {
    const { data } = await apiClient.get<TextAnalysisDto>(
      `/api/analysis/${analysisId}`
    );
    return data;
  },

  getStudentAnalyses: async (
    studentId: number,
    params: GetAnalysesParams = {}
  ): Promise<NormalizedPage<TextAnalysisSummaryDto>> => {
    const { page = 0, size = 20, sourceType, hskLevel, sortOrder } = params;

    const { data } = await apiClient.get<AnalysisPageDto<TextAnalysisSummaryDto>>(
      `/api/analysis/student/${studentId}`,
      {
        params: {
          // Conversia explicita base-0 → base-1 pentru analysis-service
          page: toAnalysisPage(page),
          size,
          ...(sourceType  && { source_type: sourceType }),
          ...(hskLevel    && { hsk_level: hskLevel }),
          ...(sortOrder   && { sort_order: sortOrder }),
        },
      }
    );

    return normalizeAnalysisPage(data);
  },

  getStudentStats: async (studentId: number): Promise<StudentStatsDto> => {
    const { data } = await apiClient.get<StudentStatsDto>(
      `/api/analysis/student/${studentId}/stats`
    );
    return data;
  },

  deleteAnalysis: async (analysisId: number): Promise<void> => {
    await apiClient.delete(`/api/analysis/${analysisId}`);
  },
};