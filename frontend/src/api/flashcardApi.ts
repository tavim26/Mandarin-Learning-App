import apiClient from './client';
import type {
  FlashcardSetDto,
  FlashcardDto,
  FlashcardProgressDto,
  FlashcardReviewDto,
  ReviewResultDto,
  FlashcardSetStatsDto,
  TotalDueStatsDto,
  CreateFlashcardSetRequest,
  UpdateFlashcardSetRequest,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
  SubmitReviewRequest,
} from '@/types';

export const flashcardApi = {
  
  createSet: async (
    data: CreateFlashcardSetRequest
  ): Promise<FlashcardSetDto> => {
    const res = await apiClient.post<FlashcardSetDto>(
      '/api/flashcards/sets',
      data
    );
    return res.data;
  },

  getSetsByStudent: async (studentId: number): Promise<FlashcardSetDto[]> => {
    const res = await apiClient.get<FlashcardSetDto[]>(
      `/api/flashcards/sets/student/${studentId}`
    );
    return res.data;
  },

  getSetById: async (setId: number): Promise<FlashcardSetDto> => {
    const res = await apiClient.get<FlashcardSetDto>(
      `/api/flashcards/sets/${setId}`
    );
    return res.data;
  },

  updateSet: async (
    setId: number,
    data: UpdateFlashcardSetRequest
  ): Promise<FlashcardSetDto> => {
    const res = await apiClient.put<FlashcardSetDto>(
      `/api/flashcards/sets/${setId}`,
      data
    );
    return res.data;
  },

  deleteSet: async (setId: number): Promise<void> => {
    await apiClient.delete(`/api/flashcards/sets/${setId}`);
  },

  getSetStats: async (setId: number): Promise<FlashcardSetStatsDto> => {
    const res = await apiClient.get<FlashcardSetStatsDto>(
      `/api/flashcards/sets/${setId}/stats`
    );
    return res.data;
  },

  
  createCard: async (data: CreateFlashcardRequest): Promise<FlashcardDto> => {
    const res = await apiClient.post<FlashcardDto>(
      '/api/flashcards/cards',
      data
    );
    return res.data;
  },

  getCardsBySet: async (setId: number): Promise<FlashcardDto[]> => {
    const res = await apiClient.get<FlashcardDto[]>(
      `/api/flashcards/sets/${setId}/cards`
    );
    return res.data;
  },

  getCardById: async (flashcardId: number): Promise<FlashcardDto> => {
    const res = await apiClient.get<FlashcardDto>(
      `/api/flashcards/cards/${flashcardId}`
    );
    return res.data;
  },

  updateCard: async (
    flashcardId: number,
    data: UpdateFlashcardRequest
  ): Promise<FlashcardDto> => {
    const res = await apiClient.put<FlashcardDto>(
      `/api/flashcards/cards/${flashcardId}`,
      data
    );
    return res.data;
  },

  deleteCard: async (flashcardId: number): Promise<void> => {
    await apiClient.delete(`/api/flashcards/cards/${flashcardId}`);
  },

  
  submitReview: async (data: SubmitReviewRequest): Promise<ReviewResultDto> => {
    const res = await apiClient.post<ReviewResultDto>(
      '/api/flashcards/reviews',
      data
    );
    return res.data;
  },

  getDueCards: async (
    studentId: number,
    setId: number
  ): Promise<FlashcardProgressDto[]> => {
    const res = await apiClient.get<FlashcardProgressDto[]>(
      `/api/flashcards/reviews/due/${studentId}`,
      { params: { setId } }
    );
    return res.data;
  },

  getTotalDue: async (): Promise<TotalDueStatsDto> => {
    const res = await apiClient.get<TotalDueStatsDto>(
      '/api/flashcards/reviews/due/all'
    );
    return res.data;
  },

  getReviewHistory: async (
    studentId: number,
    flashcardId: number
  ): Promise<FlashcardReviewDto[]> => {
    const res = await apiClient.get<FlashcardReviewDto[]>(
      `/api/flashcards/reviews/history/${studentId}/${flashcardId}`
    );
    return res.data;
  },

  getCardProgress: async (
    studentId: number,
    flashcardId: number
  ): Promise<FlashcardProgressDto> => {
    const res = await apiClient.get<FlashcardProgressDto>(
      `/api/flashcards/reviews/progress/${studentId}/${flashcardId}`
    );
    return res.data;
  },
};