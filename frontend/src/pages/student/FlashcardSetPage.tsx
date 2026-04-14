import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Brain,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
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
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { useFlashcards } from '@/hooks/useFlashcards';
import { useTTS } from '@/hooks/useTTS';
import type { FlashcardDto } from '@/hooks/useFlashcards';

// ============================================================
// Mini flip card — vizualizare in lista
// ============================================================
const FlipCardItem = ({
  card,
  onDelete,
}: {
  card: FlashcardDto;
  onDelete: () => void;
}) => {
  const [flipped, setFlipped] = useState(false);
  const { speak, isSpeaking } = useTTS();

  const hasChinese = (text: string) => /[\u4e00-\u9fff]/.test(text);
  const activeText = flipped ? card.backText : card.frontText;

  return (
    <div className="card-base p-4 space-y-3">
      {/* Card flip */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '800px' }}
        onClick={() => setFlipped((p) => !p)}
      >
        <div
          className="relative transition-transform duration-400"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '80px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/50 px-4 py-3"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="font-display text-2xl font-bold text-foreground text-center">
              {card.frontText}
            </p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/5 border border-primary/20 px-4 py-3"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-sm font-medium text-foreground text-center">
              {card.backText}
            </p>
          </div>
        </div>
      </div>

      {/* Actiuni */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlipped((p) => !p)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Flip
          </button>

          {hasChinese(activeText) && (
            <button
              onClick={() => speak(activeText)}
              className={`
                flex items-center gap-1 text-xs transition-colors
                ${isSpeaking
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
                }
              `}
            >
              <Volume2 className="h-3 w-3" />
              {isSpeaking ? 'Playing...' : 'Play'}
            </button>
          )}
        </div>

        <button
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ============================================================
// Modal adaugare card — inline
// ============================================================
interface AddCardContentProps {
  setId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCardContent = ({ setId, onClose, onSuccess }: AddCardContentProps) => {
  const { createCard, isSaving, error } = useFlashcards();
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  const handleCreate = async () => {
    if (!frontText.trim() || !backText.trim()) return;
    const ok = await createCard({
      setId,
      frontText: frontText.trim(),
      backText: backText.trim(),
    });
    if (ok) {
      onSuccess();
      onClose();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Add Flashcard</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {error && <ErrorBanner message={error} />}
        <div className="space-y-1.5">
          <Label htmlFor="front">Front (Chinese)</Label>
          <Input
            id="front"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="e.g. 你好"
            className="input-branded font-display text-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="back">Back (Pinyin / Translation)</Label>
          <Input
            id="back"
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            placeholder="e.g. nǐ hǎo — Hello"
            className="input-branded"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          className="btn-brand"
          disabled={isSaving || !frontText.trim() || !backText.trim()}
        >
          {isSaving ? 'Adding...' : 'Add Card'}
        </Button>
      </DialogFooter>
    </>
  );
};

// ============================================================
// FlashcardSetPage
// ============================================================
const FlashcardSetPage = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  const {
    sets,
    currentCards,
    currentSetStats,
    isLoading,
    error,
    fetchSets,
    fetchCards,
    fetchSetStats,
    deleteCard,
  } = useFlashcards();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlashcardDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const numericSetId = Number(setId);
  const currentSet = sets.find((s) => s.id === numericSetId);

  useEffect(() => {
    if (!setId) return;
    fetchSets();
    fetchCards(numericSetId);
    fetchSetStats(numericSetId);
  }, [setId, fetchSets, fetchCards, fetchSetStats, numericSetId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteCard(deleteTarget.id, numericSetId);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const refresh = () => {
    fetchCards(numericSetId);
    fetchSetStats(numericSetId);
    fetchSets();
  };

  if (isLoading && !currentSet) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={currentSet?.title ?? 'Flashcard Set'}
        subtitle={currentSet?.description ?? undefined}
        icon={Brain}
        breadcrumbs={[
          { label: 'Flashcards', onClick: () => navigate('/flashcards') },
          { label: currentSet?.title ?? 'Set' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/flashcards/review/${numericSetId}`)}
              className="btn-brand gap-2"
              disabled={!currentSetStats || currentSetStats.dueToday === 0}
            >
              <Play className="h-4 w-4" />
              Study{' '}
              {currentSetStats?.dueToday
                ? `(${currentSetStats.dueToday} due)`
                : ''}
            </Button>
            <Button
              variant="outline"
              onClick={() => setAddOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </Button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Stats bar */}
      {currentSetStats && currentSetStats.totalCards > 0 && (
        <div className="card-base p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              {currentSetStats.totalCards} cards total
            </span>
            <span className="text-muted-foreground text-xs">
              {currentSetStats.dueToday} due today
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="bg-sm2-new transition-all duration-500"
              style={{
                width: `${(currentSetStats.newCards / currentSetStats.totalCards) * 100}%`,
              }}
            />
            <div
              className="bg-sm2-learning transition-all duration-500"
              style={{
                width: `${(currentSetStats.learningCards / currentSetStats.totalCards) * 100}%`,
              }}
            />
            <div
              className="bg-sm2-mature transition-all duration-500"
              style={{
                width: `${(currentSetStats.matureCards / currentSetStats.totalCards) * 100}%`,
              }}
            />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sm2-new" />
              {currentSetStats.newCards} new
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sm2-learning" />
              {currentSetStats.learningCards} learning
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sm2-mature" />
              {currentSetStats.matureCards} mature
            </span>
          </div>
        </div>
      )}

      {/* Lista carduri */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : currentCards.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No cards yet"
          description="Add your first card to this set."
          actionLabel="Add Card"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentCards.map((card) => (
            <FlipCardItem
              key={card.id}
              card={card}
              onDelete={() => setDeleteTarget(card)}
            />
          ))}
        </div>
      )}

      {/* Modal adaugare */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <AddCardContent
            key={addOpen ? 'open' : 'closed'}
            setId={numericSetId}
            onClose={() => setAddOpen(false)}
            onSuccess={refresh}
          />
        </DialogContent>
      </Dialog>

      {/* Modal stergere */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Card"
        description={`Card "${deleteTarget?.frontText}" will be permanently deleted.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FlashcardSetPage;