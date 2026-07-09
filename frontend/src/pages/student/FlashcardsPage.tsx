import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { FlashcardSetCard } from '@/components/flashcards/FlashcardSetCard';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useFlashcards } from '@/hooks/useFlashcards';
import type { FlashcardSetDto } from '@/hooks/useFlashcards';

interface SetFormContentProps {
  initial?: FlashcardSetDto | null;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<boolean>;
  isSaving: boolean;
}

const SetFormContent = ({
  initial,
  onClose,
  onSubmit,
  isSaving,
}: SetFormContentProps) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(
    initial?.description ?? ''
  );

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const success = await onSubmit(title.trim(), description.trim());
    if (success) onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {initial ? 'Edit Set' : 'Create Flashcard Set'}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="setTitle">Title</Label>
          <Input
            id="setTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Flashcard Set Title"
            className="input-branded"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setDesc">Description (optional)</Label>
          <Input
            id="setDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            className="input-branded"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="btn-brand"
          disabled={isSaving || !title.trim()}
        >
          {isSaving
            ? initial
              ? 'Saving...'
              : 'Creating...'
            : initial
            ? 'Save Changes'
            : 'Create Set'}
        </Button>
      </DialogFooter>
    </>
  );
};


interface SetFormModalProps {
  open: boolean;
  initial?: FlashcardSetDto | null;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<boolean>;
  isSaving: boolean;
}

const SetFormModal = ({
  open,
  initial,
  onClose,
  onSubmit,
  isSaving,
}: SetFormModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <SetFormContent
          key={open ? (initial?.id ?? 'create') : 'closed'}
          initial={initial}
          onClose={onClose}
          onSubmit={onSubmit}
          isSaving={isSaving}
        />
      </DialogContent>
    </Dialog>
  );
};


const FlashcardsPage = () => {
  const navigate = useNavigate();
  const {
    sets,
    totalDue,
    isLoading,
    isSaving,
    error,
    fetchSets,
    fetchTotalDue,
    createSet,
    updateSet,
    deleteSet,
  } = useFlashcards();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FlashcardSetDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FlashcardSetDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSets();
    fetchTotalDue();
  }, [fetchSets, fetchTotalDue]);

  const handleCreate = async (
    title: string,
    description: string
  ): Promise<boolean> => {
    const result = await createSet({
      title,
      description: description || undefined,
    });
    return result !== null;
  };

  const handleEdit = async (
    title: string,
    description: string
  ): Promise<boolean> => {
    if (!editTarget) return false;
    return updateSet(editTarget.id, {
      title,
      description: description || undefined,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteSet(deleteTarget.id);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Flashcards"
        subtitle="Review your vocabulary with spaced repetition."
        icon={Brain}
        actions={
          <Button
            onClick={() => setCreateOpen(true)}
            className="btn-brand gap-2"
          >
            <Plus className="h-4 w-4" />
            New Set
          </Button>
        }
      />

      {/* Due today banner */}
      {totalDue && totalDue.totalDue > 0 && (
        <div className="rounded-lg border border-sm2-due/30 bg-sm2-due/8 px-4 py-3 flex items-center justify-between animate-slide-up">
          <p className="text-sm font-medium text-sm2-due">
            You have{' '}
            <span className="font-bold">{totalDue.totalDue}</span>{' '}
            cards due for review today.
          </p>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : sets.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No flashcard sets yet"
          description="Create your first set to start practicing vocabulary."
          actionLabel="Create Set"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <div key={set.id} className="relative group">
              <FlashcardSetCard
  set={set}
  onClick={() => navigate(`/flashcards/sets/${set.id}`)}
  onStudy={() => navigate(`/flashcards/review/${set.id}`)}
/>

              {/* Actiuni edit/delete  */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTarget(set);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(set);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal creare */}
      <SetFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        isSaving={isSaving}
      />

      {/* Modal editare */}
      <SetFormModal
        open={!!editTarget}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEdit}
        isSaving={isSaving}
      />

      {/* Modal confirmare stergere */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Flashcard Set"
        description={`"${deleteTarget?.title}" and all its cards will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FlashcardsPage;