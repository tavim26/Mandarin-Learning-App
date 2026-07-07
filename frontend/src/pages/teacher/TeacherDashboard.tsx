import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Pencil, Trash2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { UnitModal } from '@/components/modals/UnitModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useContent } from '@/hooks/useContent';
import { useAuth } from '@/hooks/useAuth';
import type { CourseUnitDto } from '@/hooks/useContent';

const hskBadgeClass: Record<number, string> = {
  1: 'bg-hsk-1',
  2: 'bg-hsk-2',
  3: 'bg-hsk-3',
  4: 'bg-hsk-4',
  5: 'bg-hsk-5',
  6: 'bg-hsk-6',
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { fullName, userId } = useAuth();
  const {
    units,
    isLoading,
    error,
    fetchUnits,
    deleteUnit,
  } = useContent();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CourseUnitDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseUnitDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUnits();
  }, [userId, fetchUnits]);

  const myUnits = units.filter((u) => u.createdByTeacherId === userId);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteUnit(deleteTarget.id);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Welcome, ${fullName?.split(' ')[0] ?? 'Teacher'}`}
        subtitle="Manage your course units and lessons."
        icon={LayoutDashboard}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="btn-brand gap-2"
          >
            <Plus className="h-4 w-4" />
            New Unit
          </Button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : myUnits.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No units yet"
          description="Create your first course unit to get started."
          actionLabel="Create Unit"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myUnits.map((unit) => (
            <div
              key={unit.id}
              className="card-base group p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display font-semibold text-foreground leading-snug flex-1 min-w-0 truncate">
                  {unit.title}
                </h3>
                {unit.hskLevel && (
                  <span
                    className={`hsk-badge shrink-0 ${hskBadgeClass[unit.hskLevel] ?? 'bg-muted'}`}
                  >
                    HSK {unit.hskLevel}
                  </span>
                )}
              </div>

              {unit.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {unit.description}
                </p>
              )}

              {/* Actiuni */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => navigate(`/teacher/units/${unit.id}`)}
                  className="flex-1 btn-brand text-xs"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Manage Lessons
                </Button>
                <button
                  onClick={() => setEditTarget(unit)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(unit)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UnitModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => fetchUnits()}
      />

      <UnitModal
        open={!!editTarget}
        unit={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => fetchUnits()}
      />

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Unit"
        description={`"${deleteTarget?.title}" and all its lessons will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default TeacherDashboard;