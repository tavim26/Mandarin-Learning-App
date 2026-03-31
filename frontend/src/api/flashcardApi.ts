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

export interface FlashcardSetDto {
  id: number;
  studentId: number;
  title: string;
  description: string | null;
  cardCount: number;
}

export interface FlashcardDto {
  id: number;
  setId: number;
  frontText: string;
  backText: string;
}

export interface FlashcardProgressDto {
  id: number | null;
  studentId: number;
  flashcardId: number;
  easinessFactor: number;
  intervalDays: number;
  repetitionCount: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
}

export interface FlashcardSetStatsDto {
  setId: number;
  totalCards: number;
  newCards: number;
  learningCards: number;
  matureCards: number;
  dueToday: number;
  averageEasinessFactor: number;
}

export interface ReviewResultDto {
  review: {
    id: number;
    studentId: number;
    flashcardId: number;
    reviewedAt: string;
    quality: number;
  };
  progress: FlashcardProgressDto;
}

export interface CreateFlashcardRequest {
  setId: number;
  frontText: string;
  backText: string;
}

export interface CreateFlashcardSetRequest {
  title: string;
  description: string | null;
}

export interface SubmitReviewRequest {
  flashcardId: number;
  quality: number;
}

export const getDueAll = async (): Promise<TotalDueStatsDto> => {
  const response = await apiClient.get<TotalDueStatsDto>('/api/flashcards/reviews/due/all');
  return response.data;
};

export const getFlashcardSets = async (studentId: number): Promise<FlashcardSetDto[]> => {
  const response = await apiClient.get<FlashcardSetDto[]>(
    `/api/flashcards/sets/student/${studentId}`
  );
  return response.data;
};

export const createFlashcardSet = async (data: CreateFlashcardSetRequest): Promise<FlashcardSetDto> => {
  const response = await apiClient.post<FlashcardSetDto>('/api/flashcards/sets', data);
  return response.data;
};

export const deleteFlashcardSet = async (setId: number): Promise<void> => {
  await apiClient.delete(`/api/flashcards/sets/${setId}`);
};

export const getSetStats = async (setId: number): Promise<FlashcardSetStatsDto> => {
  const response = await apiClient.get<FlashcardSetStatsDto>(`/api/flashcards/sets/${setId}/stats`);
  return response.data;
};

export const getCardsForSet = async (setId: number): Promise<FlashcardDto[]> => {
  const response = await apiClient.get<FlashcardDto[]>(`/api/flashcards/sets/${setId}/cards`);
  return response.data;
};

export const createFlashcard = async (data: CreateFlashcardRequest): Promise<FlashcardDto> => {
  const response = await apiClient.post<FlashcardDto>('/api/flashcards/cards', data);
  return response.data;
};

export const deleteFlashcard = async (flashcardId: number): Promise<void> => {
  await apiClient.delete(`/api/flashcards/cards/${flashcardId}`);
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