// Serviciul Python returneaza snake_case — nu se aplica transformare axios
// Toate campurile reflecta exact structura JSON primita de la backend

export type SourceType = 'MANUAL' | 'OCR';
export type TranslationLanguage = 'ro' | 'en';

export interface AnalysisTokenDto {
  id: number;
  analysis_id: number;
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  hsk_level: number | null;
  position_index: number;
}

// Returnat la POST /text, POST /ocr, GET /{id} — include tokenii
export interface TextAnalysisDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: SourceType;
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string | null;
  translation_language: TranslationLanguage;
  tokens: AnalysisTokenDto[];
}

// Returnat in listare paginata — fara tokeni
export interface TextAnalysisSummaryDto {
  id: number;
  student_id: number;
  raw_text: string;
  source_type: SourceType;
  overall_hsk_level: number | null;
  created_at: string;
  translated_text: string | null;
  translation_language: TranslationLanguage;
}

export interface HskTokenDistribution {
  hsk_level: number | null;
  token_count: number;
}

export interface UniqueCharsPerHskLevel {
  hsk_level: number;
  unique_count: number;
  total_in_level: number;
  percentage: number;
}

export interface StudentStatsDto {
  token_distribution: HskTokenDistribution[];
  source_type_split: Record<SourceType, number>;
  unique_chars_per_hsk_level: UniqueCharsPerHskLevel[];
}

export interface AnalyzeTextRequestDto {
  raw_text: string;
  translation_language?: TranslationLanguage;
}

// Folosit de ChineseText component — nu persista in DB
export interface PreviewRequest {
  text: string;
}

export interface PreviewTokenDto {
  hanzi: string;
  pinyin: string | null;
  hsk_level: number | null;
  position_index: number;
}

export interface PreviewResponse {
  tokens: PreviewTokenDto[];
}