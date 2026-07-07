export type SourceType = 'MANUAL' | 'OCR';

export type TranslationLanguage = 'ro' | 'en' | 'de' | 'es' | 'fr';

export type PartOfSpeech =
  | 'verb'
  | 'substantiv'
  | 'adjectiv'
  | 'adverb'
  | 'pronume'
  | 'nume propriu'
  | 'numar'
  | 'particula'
  | 'prepozitie'
  | 'conjunctie'
  | 'auxiliar'
  | 'interjectie'
  | 'punctuatie'
  | 'necunoscut'
  | null;

export interface AnalysisTokenDto {
  id: number;
  analysis_id: number;
  hanzi: string;
  pinyin: string;
  translation: string;
  hsk_level: number | null;
  position_index: number;
  pos: PartOfSpeech;
}

export interface TextAnalysisDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: SourceType;
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string;
  translation_language: TranslationLanguage;
  tokens: AnalysisTokenDto[];
}

export interface TextAnalysisSummaryDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: SourceType;
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string;
  translation_language: TranslationLanguage;
 
}

export interface TokenDistributionDto {
  hsk_level: number | null;
  token_count: number;
}

export interface UniqueCharsPerHskDto {
  hsk_level: number;
  unique_count: number;
  total_in_level: number;
  percentage: number;
}

export interface StudentStatsDto {
  token_distribution: TokenDistributionDto[];
  source_type_split: Record<SourceType, number>;
  unique_chars_per_hsk_level: UniqueCharsPerHskDto[];
}

export interface PreviewTokenDto {
  hanzi: string;
  pinyin: string;
  hsk_level: number | null;
  position_index: number;
  pos: PartOfSpeech;
}

export interface PreviewResponseDto {
  tokens: PreviewTokenDto[];
}

export interface AnalysisPageDto<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface AnalysisListParams {
  page?: number;
  size?: number;
  source_type?: SourceType;
  hsk_level?: number;
  sort_order?: 'newest' | 'oldest';
}