import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { ExerciseModal } from '@/components/modals/ExerciseModal';
import { MaterialModal } from '@/components/modals/MaterialModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useContent } from '@/hooks/useContent';
import type { ExerciseDto, LessonMaterialDto } from '@/hooks/useContent';
import { MaterialPreview } from '@/components/common/MaterialPreview';

const difficultyDots = (level: number | null) => {
  if (!level) return null;
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < level ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </span>
  );
};

const TeacherLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const {
    currentLesson,
    materials,
    exerciseTypes,
    isLoading,
    error,
    fetchLesson,
    deleteExercise,
    deleteMaterial,
  } = useContent();

  const [activeTab, setActiveTab] = useState<'exercises' | 'materials'>(
    'exercises'
  );
  const [createExOpen, setCreateExOpen] = useState(false);
  const [editExTarget, setEditExTarget] = useState<ExerciseDto | null>(null);
  const [deleteExTarget, setDeleteExTarget] = useState<ExerciseDto | null>(
    null
  );
  const [createMatOpen, setCreateMatOpen] = useState(false);
  const [deleteMatTarget, setDeleteMatTarget] =
    useState<LessonMaterialDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    fetchLesson(Number(lessonId));
  }, [lessonId, fetchLesson]);

  const refresh = () => {
    if (lessonId) fetchLesson(Number(lessonId));
  };

  const handleDeleteExercise = async () => {
    if (!deleteExTarget) return;
    setIsDeleting(true);
    const success = await deleteExercise(deleteExTarget.id);
    setIsDeleting(false);
    if (success) setDeleteExTarget(null);
  };

  const handleDeleteMaterial = async () => {
    if (!deleteMatTarget) return;
    setIsDeleting(true);
    const success = await deleteMaterial(deleteMatTarget.id);
    setIsDeleting(false);
    if (success) setDeleteMatTarget(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) return <ErrorBanner message={error} />;
  if (!currentLesson) return null;

  const exercises = currentLesson.exercises ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={currentLesson.title}
        subtitle={currentLesson.description ?? undefined}
        icon={BookOpen}
        breadcrumbs={[
          {
            label: 'My Units',
            onClick: () => navigate('/teacher/dashboard'),
          },
          {
            label: `Unit #${currentLesson.unitId}`,
            onClick: () =>
              navigate(`/teacher/units/${currentLesson.unitId}`),
          },
          { label: currentLesson.title },
        ]}
        actions={
          activeTab === 'exercises' ? (
            <Button
              onClick={() => setCreateExOpen(true)}
              className="btn-brand gap-2"
            >
              <Plus className="h-4 w-4" />
              New Exercise
            </Button>
          ) : (
            <Button
              onClick={() => setCreateMatOpen(true)}
              className="btn-brand gap-2"
            >
              <Plus className="h-4 w-4" />
              Upload Material
            </Button>
          )
        }
      />

      {/* Statistici exercitii */}
      {exerciseTypes && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(exerciseTypes.exerciseTypes).map(
            ([type, count]) => (
              <span
                key={type}
                className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {type.replace(/_/g, ' ')}: {count}
              </span>
            )
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('exercises')}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-medium
            border-b-2 transition-colors duration-150
            ${activeTab === 'exercises'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Layers className="h-4 w-4" />
          Exercises ({exercises.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`
            flex items-center gap-2 px-4 py-2.5 text-sm font-medium
            border-b-2 transition-colors duration-150
            ${activeTab === 'materials'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <FileText className="h-4 w-4" />
          Materials ({materials.length})
        </button>
      </div>

      {/* Tab: Exercises */}
      {activeTab === 'exercises' && (
        <>
          {exercises.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No exercises yet"
              description="Add the first exercise to this lesson."
              actionLabel="Create Exercise"
              onAction={() => setCreateExOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="card-base flex items-start gap-4 p-4"
                >
                  {/* Index */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {exercise.type.replace(/_/g, ' ')}
                      </span>
                      {difficultyDots(exercise.difficulty)}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {exercise.prompt}
                    </p>
                  </div>

                  {/* Actiuni */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditExTarget(exercise)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteExTarget(exercise)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Materials */}
      {activeTab === 'materials' && (
        <>
          {materials.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No materials yet"
              description="Upload the first material for this lesson."
              actionLabel="Upload Material"
              onAction={() => setCreateMatOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              {materials.map((material) => {
  const type = material.type.toLowerCase();
  const isAudioVideo = type === 'audio' || type === 'video';

  return (
    <div
      key={material.id}
      className="card-base p-4 space-y-3"
    >
      {/* Layout principal */}
      <div className="flex items-center gap-4">
        {/* Preview compact — imagine, pdf, word, link */}
        {!isAudioVideo && (
          <MaterialPreview material={material} />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground truncate">
            {material.title}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {material.type}
          </p>
        </div>

        {/* Actiuni */}
        <div className="flex items-center gap-2 shrink-0">
          
          <a
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {type === 'link' ? 'Open' : 'View'}
          </a>
          <button
            onClick={() => setDeleteMatTarget(material)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Audio/Video preview — ocupa toata latimea */}
      {isAudioVideo && (
        <MaterialPreview material={material} />
      )}
    </div>
  );
})}
            </div>
          )}
        </>
      )}

      {/* Modals Exercises */}
      <ExerciseModal
        open={createExOpen}
        lessonId={currentLesson.id}
        onClose={() => setCreateExOpen(false)}
        onSuccess={refresh}
      />

      <ExerciseModal
        open={!!editExTarget}
        lessonId={currentLesson.id}
        exercise={editExTarget}
        onClose={() => setEditExTarget(null)}
        onSuccess={refresh}
      />

      <DeleteConfirmModal
        open={!!deleteExTarget}
        title="Delete Exercise"
        description="This exercise will be permanently deleted."
        isLoading={isDeleting}
        onConfirm={handleDeleteExercise}
        onClose={() => setDeleteExTarget(null)}
      />

      {/* Modals Materials */}
      <MaterialModal
        open={createMatOpen}
        lessonId={currentLesson.id}
        onClose={() => setCreateMatOpen(false)}
        onSuccess={refresh}
      />

      <DeleteConfirmModal
        open={!!deleteMatTarget}
        title="Delete Material"
        description={`"${deleteMatTarget?.title}" will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDeleteMaterial}
        onClose={() => setDeleteMatTarget(null)}
      />
    </div>
  );
};

export default TeacherLessonPage;