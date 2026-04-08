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

// ExerciseDto este un discriminated union complet.
// Narrowing dupa `exercise.type` garanteaza tipul corect al `contentData`.
export type ExerciseDto =
  | {
      id: number;
      lessonId: number;
      type: 'MULTIPLE_CHOICE';
      prompt: string;
      difficulty: number | null;
      contentData: MultipleChoiceContentData | null;
    }
  | {
      id: number;
      lessonId: number;
      type: 'TRANSLATION';
      prompt: string;
      difficulty: number | null;
      contentData: TranslationContentData | null;
    }
  | {
      id: number;
      lessonId: number;
      type: 'FILL_BLANK';
      prompt: string;
      difficulty: number | null;
      contentData: FillBlankContentData | null;
    }
  | {
      id: number;
      lessonId: number;
      type: 'MATCHING';
      prompt: string;
      difficulty: number | null;
      contentData: MatchingContentData | null;
    };

export interface LessonMaterialDto {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
}

// --- contentData variaza dupa tipul exercitiului ---
// Fiecare varianta poarta campul `type` ca literal — permite narrowing automat.

export interface MultipleChoiceContentData {
  type: 'MULTIPLE_CHOICE';
  options: string[];
  correctIndex: number;
}

export interface TranslationContentData {
  type: 'TRANSLATION';
  acceptedAnswers: string[];
}

// Cheia este correctAnswers — nu answers (vezi EvaluationService.java)
export interface FillBlankContentData {
  type: 'FILL_BLANK';
  correctAnswers: string[];
}

export interface MatchingContentData {
  type: 'MATCHING';
  pairs: MatchingPair[];
}

export interface MatchingPair {
  left: string;
  right: string;
}

export type ExerciseContentData =
  | MultipleChoiceContentData
  | TranslationContentData
  | FillBlankContentData
  | MatchingContentData;

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
  // contentData trimis catre backend nu include campul `type` —
  // backend-ul il are deja separat in coloana `type`.
  contentData?: Omit<ExerciseContentData, 'type'>;
}

export interface UpdateExerciseRequest {
  type: ExerciseType;
  prompt: string;
  difficulty?: number;
  contentData?: Omit<ExerciseContentData, 'type'>;
}

export interface CreateMaterialRequest {
  lessonId: number;
  title: string;
  type?: string;
  url: string;
}