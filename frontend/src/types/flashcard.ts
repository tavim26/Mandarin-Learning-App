// --- Enumerari ---

export type FlashcardCategory = 'new' | 'learning' | 'mature' | 'due';

// Valori quality conform algoritmului SM-2
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

// --- DTOs primite de la backend ---

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

// id este null pentru carduri fara progress record (nevazute niciodata)
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

export interface FlashcardReviewDto {
  id: number;
  studentId: number;
  flashcardId: number;
  reviewedAt: string;
  quality: ReviewQuality;
}

export interface ReviewResultDto {
  review: FlashcardReviewDto;
  progress: FlashcardProgressDto;
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

export interface DueCountBySetDto {
  setId: number;
  setTitle: string;
  dueCount: number;
}

export interface TotalDueStatsDto {
  totalDue: number;
  bySet: DueCountBySetDto[];
}

// --- Request bodies ---

export interface CreateFlashcardSetRequest {
  title: string;
  description?: string;
}

export interface UpdateFlashcardSetRequest {
  title: string;
  description?: string;
}

export interface CreateFlashcardRequest {
  setId: number;
  frontText: string;
  backText: string;
}

export interface UpdateFlashcardRequest {
  frontText: string;
  backText: string;
}

export interface SubmitReviewRequest {
  flashcardId: number;
  quality: ReviewQuality;
}