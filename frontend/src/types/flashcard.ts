// Scala calitate SM-2: 0=Again, 1=Again(hard), 2=Hard, 3=Good, 4=Good(easy), 5=Easy
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type Sm2Category = 'new' | 'learning' | 'mature' | 'due';

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
  id: number | null;         // null = card nou, nevazut niciodata
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
  // studentId absent — vine din X-User-Id header
}