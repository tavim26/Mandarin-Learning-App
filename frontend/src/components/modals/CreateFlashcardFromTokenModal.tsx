import { useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useFlashcards } from '@/hooks/useFlashcards';

interface Props {
  open: boolean;
  hanzi: string;
  pinyin: string;
  translation?: string;
  onClose: () => void;
}

// Continut modal 
const ModalContent = ({
  hanzi,
  pinyin,
  translation,
  onClose,
}: {
  hanzi: string;
  pinyin: string;
  translation?: string;
  onClose: () => void;
}) => {
  const { sets, isSaving, error, fetchSets, createCard } = useFlashcards();
  const [selectedSetId, setSelectedSetId] = useState('');
  const [success, setSuccess] = useState(false);

  
  useState(() => {
    fetchSets();
  });

  const frontText = hanzi;
  const backText = translation
    ? `${pinyin} — ${translation}`
    : pinyin;

  const handleCreate = async () => {
    if (!selectedSetId) return;
    const ok = await createCard({
      setId: Number(selectedSetId),
      frontText,
      backText,
    });
    if (ok) setSuccess(true);
  };

  if (success) {
    return (
      <div className="py-6 text-center space-y-3">
        <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-student/10">
          <Brain className="h-7 w-7 text-student" />
        </div>
        <p className="font-medium text-foreground">
          Flashcard created successfully!
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-display text-lg font-bold text-primary">
            {hanzi}
          </span>{' '}
          has been added to your set.
        </p>
        <Button onClick={onClose} className="btn-brand w-full mt-2">
          Done
        </Button>
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Create Flashcard
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {error && <ErrorBanner message={error} />}

        {/* Preview card */}
        <div className="rounded-xl border-2 border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Front
            </p>
            <p className="font-display text-3xl font-bold text-foreground">
              {frontText}
            </p>
          </div>
          <div className="divider" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Back
            </p>
            <p className="text-sm text-foreground">{backText}</p>
          </div>
        </div>

        {/* Selectie set */}
        <div className="space-y-1.5">
          <Label>Add to set</Label>
          {sets.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground text-center space-y-1">
              <LoadingSpinner size="sm" className="mx-auto" />
              <p>Loading sets...</p>
            </div>
          ) : (
            <Select value={selectedSetId} onValueChange={setSelectedSetId}>
              <SelectTrigger className="input-branded">
                <SelectValue placeholder="Select a flashcard set..." />
              </SelectTrigger>
              <SelectContent>
                {sets.map((set) => (
                  <SelectItem key={set.id} value={String(set.id)}>
                    <span className="flex items-center gap-2">
                      {set.title}
                      <span className="text-xs text-muted-foreground">
                        ({set.cardCount} cards)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          className="btn-brand gap-2"
          disabled={isSaving || !selectedSetId}
        >
          {isSaving
            ? <LoadingSpinner size="sm" />
            : <Plus className="h-4 w-4" />
          }
          {isSaving ? 'Creating...' : 'Create'}
        </Button>
      </DialogFooter>
    </>
  );
};



// Wrapper
export const CreateFlashcardFromTokenModal = ({
  open,
  hanzi,
  pinyin,
  translation,
  onClose,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <ModalContent
          key={open ? hanzi : 'closed'}
          hanzi={hanzi}
          pinyin={pinyin}
          translation={translation}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};