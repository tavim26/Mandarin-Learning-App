// --- Enumerari ---

export type ExerciseType =
  | 'MULTIPLE_CHOICE'
  | 'TRANSLATION'
  | 'FILL_BLANK'
  | 'MATCHING';

// --- DTOs primite de la backend ---

export interface CourseUnitDto {
  id: number;
  title: string;
  description: string | null;
  hskLevel: number | null;
  orderIndex: number;
}

// Unitate cu lectiile incluse — GET /api/content/units/{id}/full
export interface CourseUnitFullDto extends CourseUnitDto {
  lessons: LessonDto[];
}

// exercises este null in orice context EXCEPT GET /api/content/lessons/{id}
export interface LessonDto {
  id: number;
  unitId: number;
  title: string;
  description: string | null;
  xpReward: number;
  orderIndex: number;
  exercises: ExerciseDto[] | null;
}

export interface ExerciseDto {
  id: number;
  lessonId: number;
  type: ExerciseType;
  prompt: string;
  difficulty: number | null;
  contentData: ExerciseContentData | null;
}

export interface LessonMaterialDto {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
}

// --- contentData variaza dupa tipul exercitiului ---

export type ExerciseContentData =
  | MultipleChoiceContentData
  | TranslationContentData
  | FillBlankContentData
  | MatchingContentData;

export interface MultipleChoiceContentData {
  options: string[];
  correctIndex: number;
}

export interface TranslationContentData {
  acceptedAnswers: string[];
}

// Cheia este correctAnswers — nu answers (vezi EvaluationService.java)
export interface FillBlankContentData {
  correctAnswers: string[];
}

export interface MatchingContentData {
  pairs: MatchingPair[];
}

export interface MatchingPair {
  left: string;
  right: string;
}

// --- Request bodies ---

export interface CreateCourseUnitRequest {
  title: string;
  description?: string;
  hskLevel?: number;
  orderIndex: number;
}

export interface UpdateCourseUnitRequest {
  title: string;
  description?: string;
  hskLevel?: number;
  orderIndex?: number;
}

export interface CreateLessonRequest {
  unitId: number;
  title: string;
  description?: string;
  xpReward?: number;
  orderIndex: number;
}

export interface UpdateLessonRequest {
  title: string;
  description?: string;
  xpReward?: number;
  orderIndex?: number;
}

export interface CreateExerciseRequest {
  lessonId: number;
  type: ExerciseType;
  prompt: string;
  difficulty?: number;
  contentData?: ExerciseContentData;
}

export interface UpdateExerciseRequest {
  type: ExerciseType;
  prompt: string;
  difficulty?: number;
  contentData?: ExerciseContentData;
}

export interface CreateMaterialRequest {
  lessonId: number;
  title: string;
  type?: string;
  url: string;
}