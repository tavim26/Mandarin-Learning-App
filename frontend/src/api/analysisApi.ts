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

export const previewText = async (text: string): Promise<TextPreviewDto> => {
  const response = await apiClient.post<TextPreviewDto>('/api/analysis/preview', {
    text,
  });
  return response.data;
};