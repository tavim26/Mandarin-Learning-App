export type ExerciseType =
  | 'MULTIPLE_CHOICE'
  | 'TRANSLATION'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'ORDERING';

export interface MultipleChoiceData {
  options: string[];
  correctIndex: number;
}

export interface TranslationData {
  acceptedAnswers: string[];
}

export interface FillBlankData {
  correctAnswers: string[];
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingData {
  pairs: MatchingPair[];
}

export interface OrderingData {
  words: string[];
  correctOrder: string[];
  translation: string;
}

export type ExerciseContentData =
  | MultipleChoiceData
  | TranslationData
  | FillBlankData
  | MatchingData
  | OrderingData;

export interface MultipleChoiceAnswer {
  selectedIndex: number;
}

export interface TranslationAnswer {
  translation: string;
}

export interface FillBlankAnswer {
  answers: string[];
}

export interface MatchingAnswer {
  matches: Record<string, string>;
}

export interface OrderingAnswer {
  order: string[];
}

export type SubmittedAnswer =
  | MultipleChoiceAnswer
  | TranslationAnswer
  | FillBlankAnswer
  | MatchingAnswer
  | OrderingAnswer;


export interface CourseUnitDto {
  id: number;
  title: string;
  description: string | null;
  hskLevel: number | null;
  orderIndex: number;
  createdByTeacherId: number | null;
}

export interface LessonDto {
  id: number;
  unitId: number;
  title: string;
  description: string | null;
  xpReward: number;
  orderIndex: number;
  exercises: ExerciseDto[] | null; 
}

export interface CourseUnitFullDto extends CourseUnitDto {
  lessons: LessonDto[];
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

export interface UnitXpStatsDto {
  unitId: number;
  totalXp: number;
}

export interface UnitLessonCountDto {
  unitId: number;
  totalLessons: number;
}

export interface LessonExerciseTypesDto {
  lessonId: number;
  exerciseTypes: Partial<Record<ExerciseType, number>>;
}