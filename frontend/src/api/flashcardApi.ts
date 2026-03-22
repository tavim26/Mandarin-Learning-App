import apiClient from './client';

export interface DueCountBySetDto {
  setId: number;
  setTitle: string;
  dueCount: number;
}

export interface TotalDueStatsDto {
  totalDue: number;
  bySet: DueCountBySetDto[];
}

export const getDueAll = async (): Promise<TotalDueStatsDto> => {
  const response = await apiClient.get<TotalDueStatsDto>('/api/flashcards/reviews/due/all');
  return response.data;
};