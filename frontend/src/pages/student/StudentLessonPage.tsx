import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { ExerciseRenderer } from '@/components/exercises/ExerciseRenderer';
import { useContent } from '@/hooks/useContent';
import { useProgress } from '@/hooks/useProgress';
import type { SubmittedAnswer, ExerciseAttemptDto } from '@/hooks/useProgress';

const StudentLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const {
    currentLesson,
    isLoading: isLoadingContent,
    error,
    fetchLesson,
  } = useContent();

  const {
    lessonProgress,
    submitAttempt,
    fetchLessonProgress,
  } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptResult, setAttemptResult] = useState<ExerciseAttemptDto | null>(
    null
  );
  const [submittedAnswer, setSubmittedAnswer] =
    useState<SubmittedAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


const [initialized, setInitialized] = useState(false);

// Initializare index la primul render cu date disponibile
// Apelarea setState in timpul randarii este permisa de React pentru acest pattern
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
    exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;

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

  const handleNext = () => {
    if (isLast) {
      navigate(-1);
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
          Continuing from exercise {currentIndex + 1} — your progress has been
          saved.
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

      {exercises.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No exercises"
          description="This lesson has no exercises yet."
        />
      ) : currentExercise ? (
        <div className="space-y-6">
          {/* Card exercitiu — key garanteaza remount la schimbarea indexului */}
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

          {/* Actiuni */}
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
              <Button onClick={handleNext} className="btn-brand gap-2">
                {isLast ? 'Finish Lesson' : 'Next Exercise'}
                <ChevronRight className="h-4 w-4" />
              </Button>
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