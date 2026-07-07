import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  Music,
  Video,
  File,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer';
import { useContent } from '@/hooks/useContent';
import { useProgress } from '@/hooks/useProgress';
import type {
  SubmittedAnswer,
  ExerciseAttemptDto,
} from '@/hooks/useProgress';
import type { LessonMaterialDto } from '@/hooks/useContent';


// Panoul de materiale — collapsibil
const MaterialTypeIcon = ({ type }: { type: string }) => {
  const t = type.toLowerCase();
  if (t === 'audio') return <Music className="h-4 w-4 text-purple-500" />;
  if (t === 'video') return <Video className="h-4 w-4 text-blue-500" />;
  if (t === 'pdf') return <FileText className="h-4 w-4 text-red-500" />;
  if (t === 'link') return <ExternalLink className="h-4 w-4 text-primary" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

const MaterialsPanel = ({
  materials,
}: {
  materials: LessonMaterialDto[];
}) => {
  const [open, setOpen] = useState(false);

  if (materials.length === 0) return null;

  return (
    <div className="card-base overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="
          w-full flex items-center justify-between
          px-4 py-3 text-sm font-medium text-foreground
          hover:bg-muted/50 transition-colors
        "
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Lesson Materials ({materials.length})
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border animate-fade-in">
          {materials.map((material) => (
            <div
              key={material.id}
              className="px-4 py-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <MaterialTypeIcon type={material.type} />
                  <span className="text-sm font-medium text-foreground truncate">
                    {material.title}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize shrink-0">
                    {material.type}
                  </span>
                </div>
                
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  Open
                </a>
              </div>

              {/* Preview inline pentru audio/video */}
              {material.type.toLowerCase() === 'audio' && (
                <audio
                  controls
                  src={material.url}
                  className="w-full h-8"
                  style={{ accentColor: 'hsl(var(--primary))' }}
                />
              )}
              {material.type.toLowerCase() === 'video' && (
                <video
                  controls
                  src={material.url}
                  className="w-full max-h-32 rounded-lg bg-black"
                  preload="metadata"
                />
              )}
              {material.type.toLowerCase() === 'image' && (
                <img
                  src={material.url}
                  alt={material.title}
                  className="w-full max-h-40 object-contain rounded-lg border border-border"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};



// StudentLessonPage
const StudentLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const {
    currentLesson,
    materials,
    isLoading: isLoadingContent,
    error,
    fetchLesson,
  } = useContent();

  const { lessonProgress, submitAttempt, fetchLessonProgress, getLatestLessonProgress } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptResult, setAttemptResult] =
    useState<ExerciseAttemptDto | null>(null);
  const [submittedAnswer, setSubmittedAnswer] =
    useState<SubmittedAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

 
  if (
    !initialized &&
    currentLesson?.exercises?.length &&
    lessonProgress !== undefined 
  ) {
    setInitialized(true);
    if (lessonProgress?.status === 'IN_PROGRESS') {
      const total = currentLesson.exercises.length;
      const resumeIdx = Math.min(
        Math.floor((lessonProgress.completionPct / 100) * total),
        total - 1
      );
      if (resumeIdx > 0) setCurrentIndex(resumeIdx);
    }
  }

  useEffect(() => {
    if (!lessonId) return;
    const id = Number(lessonId);
    fetchLesson(id);
    fetchLessonProgress(id);
  }, [lessonId, fetchLesson, fetchLessonProgress]);

  const exercises = currentLesson?.exercises ?? [];
  const currentExercise = exercises[currentIndex] ?? null;
  const isLast = currentIndex === exercises.length - 1;
  const progressPct =
    exercises.length > 0
      ? ((currentIndex + 1) / exercises.length) * 100
      : 0;

  const handleAnswer = useCallback((answer: SubmittedAnswer) => {
    setSubmittedAnswer(answer);
  }, []);

  const handleSubmit = async () => {
    if (!submittedAnswer || !currentExercise || isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitAttempt({
      exerciseId: currentExercise.id,
      submittedAnswer,
    });
    setAttemptResult(result);
    setIsSubmitting(false);
  };

  const handleNext = async () => {
    if (isLast && currentLesson && lessonId) {
      const id = Number(lessonId);
      
      const latestProgress = await getLatestLessonProgress(id);
      
      navigate(`/lessons/${id}/complete`, {
        state: {
          lessonTitle: currentLesson.title,
          unitId: currentLesson.unitId,
          xpAwarded: latestProgress?.xpAwarded ?? null
        }
      });
    } else {
      setAttemptResult(null);
      setSubmittedAnswer(null);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setAttemptResult(null);
    setSubmittedAnswer(null);
    setCurrentIndex((prev) => prev - 1);
  };


  const handleTryAgain = () => {
    setAttemptResult(null);
    
  };

  if (isLoadingContent) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!currentLesson) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={currentLesson.title}
        subtitle={currentLesson.description ?? undefined}
        icon={BookOpen}
        breadcrumbs={[
          { label: 'Lessons', onClick: () => navigate('/lessons') },
          {
            label: `Unit #${currentLesson.unitId}`,
            onClick: () =>
              navigate(`/lessons/units/${currentLesson.unitId}`),
          },
          { label: currentLesson.title },
        ]}
      />

      {/* Banner resume */}
      {lessonProgress?.status === 'IN_PROGRESS' && currentIndex > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/8 px-4 py-2.5 text-sm text-primary animate-fade-in">
          Continuing from exercise {currentIndex + 1} — your progress has
          been saved.
        </div>
      )}

      {/* Progress bar lectie */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exercise {currentIndex + 1} of {exercises.length}
          </span>
          {lessonProgress && (
            <span className="font-medium text-primary">
              {lessonProgress.completionPct.toFixed(0)}% complete
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Materiale lectie  */}
      <MaterialsPanel materials={materials} />

      {exercises.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exercises"
          description="This lesson has no exercises yet."
        />
      ) : currentExercise ? (
        <div className="space-y-6">
          {/* Card exercitiu */}
          <div key={currentIndex} className="card-base p-6">
            <ExerciseRenderer
              exercise={currentExercise}
              onAnswer={handleAnswer}
              attemptResult={
                attemptResult
                  ? {
                      isCorrect: attemptResult.isCorrect,
                      score: attemptResult.score,
                      feedbackText: attemptResult.feedbackText,
                    }
                  : null
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Navigare */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSubmitting}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {attemptResult ? (
              <div className="flex items-center gap-3">
                {/* Butonul de Try Again apare doar dacă răspunsul este greșit */}
                {!attemptResult.isCorrect && (
                  <Button 
                    onClick={handleTryAgain} 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10 gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}
                
                <Button onClick={handleNext} className="btn-brand gap-2">
                  {isLast ? 'Finish Lesson' : 'Next Exercise'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!submittedAnswer || isSubmitting}
                className="btn-brand gap-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StudentLessonPage;