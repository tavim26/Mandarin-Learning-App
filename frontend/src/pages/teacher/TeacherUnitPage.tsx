import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { LessonModal } from '@/components/modals/LessonModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useContent } from '@/hooks/useContent';
import type { LessonDto } from '@/hooks/useContent';

const TeacherUnitPage = () => {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const {
    currentUnit,
    isLoading,
    error,
    fetchUnitFull,
    deleteLesson,
  } = useContent();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LessonDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!unitId) return;
    fetchUnitFull(Number(unitId));
  }, [unitId, fetchUnitFull]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteLesson(deleteTarget.id);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const refresh = () => {
    if (unitId) fetchUnitFull(Number(unitId));
  };

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
          {
            label: 'My Units',
            onClick: () => navigate('/teacher/dashboard'),
          },
          { label: currentUnit.title },
        ]}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="btn-brand gap-2"
          >
            <Plus className="h-4 w-4" />
            New Lesson
          </Button>
        }
      />

      {currentUnit.lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons yet"
          description="Create the first lesson for this unit."
          actionLabel="Create Lesson"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {currentUnit.lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className="card-base flex items-center gap-4 p-4"
            >
              {/* Index */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                {index + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-medium text-foreground truncate">
                  {lesson.title}
                </p>
                {lesson.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lesson.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Zap className="h-3 w-3" />
                  {lesson.xpReward} XP
                </div>
              </div>

              {/* Actiuni */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(`/teacher/lessons/${lesson.id}`)
                  }
                  className="gap-1.5 text-xs"
                >
                  Exercises
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <button
                  onClick={() => setEditTarget(lesson)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(lesson)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LessonModal
        open={createOpen}
        unitId={currentUnit.id}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      <LessonModal
        open={!!editTarget}
        unitId={currentUnit.id}
        lesson={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={refresh}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Lesson"
        description={`"${deleteTarget?.title}" and all its exercises will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default TeacherUnitPage;