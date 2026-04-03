import apiClient from './client';
import type {
  FlashcardSetDto,
  FlashcardDto,
  FlashcardProgressDto,
  FlashcardSetStatsDto,
  TotalDueStatsDto,
  ReviewResultDto,
  CreateFlashcardSetRequest,
  UpdateFlashcardSetRequest,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  SubmitReviewRequest,
} from '@/types';

// --- Seturi ---

export const getFlashcardSets = async (studentId: number): Promise<FlashcardSetDto[]> => {
  const response = await apiClient.get<FlashcardSetDto[]>(
    `/api/flashcards/sets/student/${studentId}`
  );
  return response.data;
};

export const getFlashcardSet = async (setId: number): Promise<FlashcardSetDto> => {
  const response = await apiClient.get<FlashcardSetDto>(`/api/flashcards/sets/${setId}`);
  return response.data;
};

export const getSetStats = async (setId: number): Promise<FlashcardSetStatsDto> => {
  const response = await apiClient.get<FlashcardSetStatsDto>(
    `/api/flashcards/sets/${setId}/stats`
  );
  return response.data;
};

export const createFlashcardSet = async (
  data: CreateFlashcardSetRequest
): Promise<FlashcardSetDto> => {
  const response = await apiClient.post<FlashcardSetDto>('/api/flashcards/sets', data);
  return response.data;
};

export const updateFlashcardSet = async (
  setId: number,
  data: UpdateFlashcardSetRequest
): Promise<FlashcardSetDto> => {
  const response = await apiClient.put<FlashcardSetDto>(`/api/flashcards/sets/${setId}`, data);
  return response.data;
};

export const deleteFlashcardSet = async (setId: number): Promise<void> => {
  await apiClient.delete(`/api/flashcards/sets/${setId}`);
};

// --- Carduri individuale ---

export const getCardsForSet = async (setId: number): Promise<FlashcardDto[]> => {
  const response = await apiClient.get<FlashcardDto[]>(`/api/flashcards/sets/${setId}/cards`);
  return response.data;
};

export const createFlashcard = async (data: CreateFlashcardRequest): Promise<FlashcardDto> => {
  const response = await apiClient.post<FlashcardDto>('/api/flashcards/cards', data);
  return response.data;
};

export const updateFlashcard = async (
  flashcardId: number,
  data: UpdateFlashcardRequest
): Promise<FlashcardDto> => {
  const response = await apiClient.put<FlashcardDto>(
    `/api/flashcards/cards/${flashcardId}`,
    data
  );
  return response.data;
};

export const deleteFlashcard = async (flashcardId: number): Promise<void> => {
  await apiClient.delete(`/api/flashcards/cards/${flashcardId}`);
};

// --- Recenzii si progres SM-2 ---

export const getDueAll = async (): Promise<TotalDueStatsDto> => {
  const response = await apiClient.get<TotalDueStatsDto>('/api/flashcards/reviews/due/all');
  return response.data;
};

export const getDueCards = async (
  studentId: number,
  setId: number
): Promise<FlashcardProgressDto[]> => {
  const response = await apiClient.get<FlashcardProgressDto[]>(
    `/api/flashcards/reviews/due/${studentId}`,
    { params: { setId } }
  );
  return response.data;
};

export const submitReview = async (data: SubmitReviewRequest): Promise<ReviewResultDto> => {
  const response = await apiClient.post<ReviewResultDto>('/api/flashcards/reviews', data);
  return response.data;
};