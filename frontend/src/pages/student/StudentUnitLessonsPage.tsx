import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, Lock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { useContent } from '@/hooks/useContent';
import { useProgress } from '@/hooks/useProgress';

const StudentUnitLessonsPage = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();

  const { currentUnit, isLoading: isLoadingContent, error, fetchUnitFull } =
    useContent();
  const {
  unitProgress,
  isLoading: isLoadingProgress,
  fetchAllLessonProgress,
  fetchUnitProgress,
  getLessonProgressFromCache,
} = useProgress();

  useEffect(() => {
    if (!unitId) return;
    const id = Number(unitId);
    fetchUnitFull(id);
    fetchAllLessonProgress();
    fetchUnitProgress(id);
  }, [unitId, fetchUnitFull, fetchAllLessonProgress, fetchUnitProgress]);

  const isLoading = isLoadingContent || isLoadingProgress;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!currentUnit) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={currentUnit.title}
        subtitle={currentUnit.description ?? undefined}
        icon={BookOpen}
        breadcrumbs={[
          { label: 'Lessons', onClick: () => navigate('/lessons') },
          { label: currentUnit.title },
        ]}
      />

      {/* Unit progress */}
      {unitProgress && (
        <div className="card-base p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Unit Progress</span>
            <span className="text-muted-foreground">
              {unitProgress.completedLessons} / {unitProgress.totalLessons} lessons
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${unitProgress.unitCompletionPct}%` }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-student" />
              {unitProgress.completedLessons} completed
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              {unitProgress.inProgressLessons} in progress
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-muted-foreground" />
              {unitProgress.notStartedLessons} not started
            </span>
          </div>
        </div>
      )}

      {/* Lista lectii */}
      {currentUnit.lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons yet"
          description="This unit has no lessons available."
        />
      ) : (
        <div className="space-y-3">
          {currentUnit.lessons.map((lesson, index) => {
            const progress = getLessonProgressFromCache(lesson.id);
            const isCompleted = progress?.status === 'COMPLETED';
            const isInProgress = progress?.status === 'IN_PROGRESS';

            return (
              <button
                key={lesson.id}
                onClick={() => navigate(`/lessons/${lesson.id}`)}
                className="
                  w-full card-interactive p-4 text-left
                  flex items-center gap-4
                "
              >
                {/* Index */}
                <div
                  className={`
                    flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-full text-sm font-bold
                    ${isCompleted
                      ? 'bg-student/10 text-student'
                      : isInProgress
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-foreground truncate">
                    {lesson.title}
                  </p>
                  {lesson.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lesson.description}
                    </p>
                  )}
                  {isInProgress && progress && (
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress.completionPct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* XP + status */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                    +{lesson.xpReward} XP
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] text-student font-medium">
                      Completed
                    </span>
                  )}
                  {isInProgress && progress && (
                    <span className="text-[10px] text-primary font-medium">
                      {progress.completionPct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentUnitLessonsPage;