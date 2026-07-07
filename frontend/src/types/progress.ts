import type { SubmittedAnswer } from './content';

export type LessonStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface StudentReplicaDto {
  studentId: number;
  xpTotal: number;
  level: number;
}

export interface StudentSummaryDto {
  studentId: number;
  xpTotal: number;
  level: number;
  completedLessonsCount: number;
  inProgressLessonsCount: number;
}

export interface StudentUnitProgressDto {
  unitId: number;
  studentId: number;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  unitCompletionPct: number;
}

export interface StudentLessonProgressDto {
  id: number;
  studentId: number;
  lessonId: number;
  status: LessonStatus;
  completionPct: number;
  xpAwarded: number | null;      
  startedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;     
}

export interface ExerciseAttemptDto {
  id: number;
  studentId: number;
  exerciseId: number;
  attemptNumber: number;
  submittedAt: string;
  submittedAnswer: SubmittedAnswer;
  isCorrect: boolean;
  score: number;
  feedbackText: string | null;
}

export interface SubmitAttemptRequest {
  exerciseId: number;
  submittedAnswer: SubmittedAnswer;
  
}