import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getFlashcardSets,
  createFlashcardSet,
  deleteFlashcardSet,
  getSetStats,
  getCardsForSet,
  createFlashcard,
  deleteFlashcard,
  getDueCards,
  submitReview,
  type FlashcardSetDto,
  type FlashcardDto,
  type FlashcardProgressDto,
  type FlashcardSetStatsDto,
} from '@/api/flashcardApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import useTTS from '@/hooks/useTTS';

// ----------------------------------------------------------------
// Tipuri view
// ----------------------------------------------------------------
type View = 'list' | 'cards' | 'review';

// ----------------------------------------------------------------
// Modal creare set
// ----------------------------------------------------------------
interface CreateSetModalProps {
  onClose: () => void;
  onSave: (title: string, description: string) => Promise<void>;
}

const CreateSetModal = ({ onClose, onSave }: CreateSetModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave(title.trim(), description.trim());
      onClose();
    } catch {
      setError('Failed to create set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          New Flashcard Set
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HSK 1 Vocabulary" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={onClose} className="flex-1 h-11 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: '#e85d04' }}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// Modal adaugare card
// ----------------------------------------------------------------
interface AddCardModalProps {
  setId: number;
  onClose: () => void;
  onSave: (frontText: string, backText: string) => Promise<void>;
}

const AddCardModal = ({ onClose, onSave }: AddCardModalProps) => {
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!frontText.trim()) { setError('Front text is required.'); return; }
    if (!backText.trim()) { setError('Back text is required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSave(frontText.trim(), backText.trim());
      setFrontText('');
      setBackText('');
    } catch {
      setError('Failed to add card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-sm space-y-5"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Add Card
        </h2>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Front (Chinese) *
            </label>
            <Input
              className="h-11 rounded-xl border-gray-200 bg-gray-50 text-lg"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="e.g. 你好"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Back (Pinyin + Translation) *
            </label>
            <Input
              className="h-11 rounded-xl border-gray-200 bg-gray-50"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="e.g. nǐ hǎo — Hello"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button onClick={onClose} className="flex-1 h-11 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
            Done
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: '#e85d04' }}>
            {loading ? 'Adding...' : '+ Add Card'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// Componenta flip card
// ----------------------------------------------------------------
interface FlipCardProps {
  front: string;
  back: string;
  flipped: boolean;
  onClick: () => void;
}

const FlipCard = ({ front, back, flipped, onClick }: FlipCardProps) => {
  const { speak, isSpeaking, stop } = useTTS();

  return (
    <div
      className="mx-auto"
      style={{ width: '100%', maxWidth: '480px', height: '240px', perspective: '1000px' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Fata */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
            border: '2px solid #f3f4f6',
          }}
          onClick={onClick}
        >
          <p
            className="text-5xl font-bold text-center"
            style={{ color: '#1f2937', fontFamily: 'Outfit, sans-serif' }}
          >
            {front}
          </p>
          {/* Buton audio pe fata */}
          <button
            onClick={(e) => { e.stopPropagation(); if (isSpeaking) { stop(); } else { speak(front); } }}
            className="mt-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{
              background: isSpeaking ? '#fff7f0' : '#f9fafb',
              border: `1.5px solid ${isSpeaking ? '#e85d04' : '#e5e7eb'}`,
              color: isSpeaking ? '#e85d04' : '#9ca3af',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
          <p className="text-xs text-gray-300 mt-2">Click card to reveal</p>
        </div>

        {/* Spate */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 cursor-pointer"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: '#fff7f0',
            boxShadow: '0 8px 32px rgba(232,93,4,0.12)',
            border: '2px solid #fde8d4',
          }}
          onClick={onClick}
        >
          <p
            className="text-2xl font-semibold text-center"
            style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
          >
            {back}
          </p>
          {/* Buton audio pe spate — pronunta frontText (chineza) */}
          <button
            onClick={(e) => { e.stopPropagation(); if (isSpeaking) { stop(); } else { speak(front); } }}
            className="mt-4 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{
              background: isSpeaking ? 'rgba(232,93,4,0.15)' : 'rgba(232,93,4,0.08)',
              border: `1.5px solid ${isSpeaking ? '#e85d04' : 'rgba(232,93,4,0.2)'}`,
              color: '#e85d04',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
          <p className="text-xs mt-1" style={{ color: 'rgba(232,93,4,0.5)' }}>Click card to flip back</p>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// Sesiune de recenzie
// ----------------------------------------------------------------
interface ReviewSessionProps {
  set: FlashcardSetDto;
  studentId: number;
  onFinish: () => void;
}

// Mapare butoane → quality SM-2
const REVIEW_BUTTONS: { label: string; quality: number; color: string; bg: string }[] = [
  { label: 'Again', quality: 0, color: '#c1121f', bg: '#fef2f2' },
  { label: 'Hard', quality: 2, color: '#b45309', bg: '#fffbeb' },
  { label: 'Good', quality: 3, color: '#0369a1', bg: '#f0f9ff' },
  { label: 'Easy', quality: 5, color: '#15803d', bg: '#f0fdf4' },
];

const ReviewSession = ({ set, studentId, onFinish }: ReviewSessionProps) => {
  const [dueCards, setDueCards] = useState<FlashcardProgressDto[]>([]);
  const [cardDetails, setCardDetails] = useState<Record<number, FlashcardDto>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ quality: number; label: string }[]>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    try {
      setLoading(true);
      const due = await getDueCards(studentId, set.id);
      setDueCards(due);

      // Fetch detalii card pentru fiecare card scadent
      const { getCardsForSet } = await import('@/api/flashcardApi');
      const allCards = await getCardsForSet(set.id);
      const map: Record<number, FlashcardDto> = {};
      allCards.forEach((c) => { map[c.id] = c; });
      setCardDetails(map);
    } catch {
      // Eroare fetch
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality: number, label: string) => {
    if (submitting || !dueCards[currentIndex]) return;
    const card = dueCards[currentIndex];
    setSubmitting(true);
    try {
      await submitReview({ flashcardId: card.flashcardId, quality });
      setResults((prev) => [...prev, { quality, label }]);

      if (currentIndex + 1 >= dueCards.length) {
        setFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setFlipped(false);
      }
    } catch {
      // Eroare submit
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading cards...</p>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center">
        <div
          className="bg-white rounded-2xl p-12 space-y-3"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-4xl">✓</p>
          <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            All caught up!
          </p>
          <p className="text-sm text-gray-400">No cards due for review in this set.</p>
          <Button onClick={onFinish} className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90 mt-2" style={{ background: '#e85d04' }}>
            Back to Sets
          </Button>
        </div>
      </div>
    );
  }

  if (finished) {
    const againCount = results.filter((r) => r.quality === 0).length;
    const hardCount = results.filter((r) => r.quality === 2).length;
    const goodCount = results.filter((r) => r.quality === 3).length;
    const easyCount = results.filter((r) => r.quality === 5).length;

    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div
          className="bg-white rounded-2xl p-8 space-y-6"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div className="text-center space-y-2">
            <p className="text-4xl">🎉</p>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Session Complete!
            </p>
            <p className="text-sm text-gray-400">
              {results.length} cards reviewed from "{set.title}"
            </p>
          </div>

          {/* Sumar butoane */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Again', count: againCount, color: '#c1121f', bg: '#fef2f2' },
              { label: 'Hard', count: hardCount, color: '#b45309', bg: '#fffbeb' },
              { label: 'Good', count: goodCount, color: '#0369a1', bg: '#f0f9ff' },
              { label: 'Easy', count: easyCount, color: '#15803d', bg: '#f0fdf4' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4 text-center"
                style={{ background: item.bg }}
              >
                <p className="text-2xl font-bold" style={{ color: item.color, fontFamily: 'Outfit, sans-serif' }}>
                  {item.count}
                </p>
                <p className="text-xs font-semibold" style={{ color: item.color }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <Button
            onClick={onFinish}
            className="w-full h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            Back to Sets
          </Button>
        </div>
      </div>
    );
  }

  const currentProgress = dueCards[currentIndex];
  const currentCard = cardDetails[currentProgress?.flashcardId];

  return (
    <div className="space-y-6 max-w-lg mx-auto">

      {/* Header progres */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {dueCards.length}
          </span>
          {currentProgress?.id === null && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ background: '#f3f4f6', color: '#9ca3af' }}
            >
              New
            </span>
          )}
        </div>
      </div>

      {/* Progress bar sesiune */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${(currentIndex / dueCards.length) * 100}%`, background: '#e85d04' }}
        />
      </div>

      {/* Flip card */}
      {currentCard ? (
        <FlipCard
          front={currentCard.frontText}
          back={currentCard.backText}
          flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
        />
      ) : (
        <div className="h-60 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading card...</p>
        </div>
      )}

      {/* Hint click */}
      {!flipped && (
        <p className="text-xs text-center text-gray-300">Click the card to reveal the answer</p>
      )}

      {/* Butoane review — vizibile doar dupa flip */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {REVIEW_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handleReview(btn.quality, btn.label)}
              disabled={submitting}
              className="py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex flex-col items-center gap-0.5"
              style={{ background: btn.bg, color: btn.color, border: `2px solid ${btn.color}22` }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Vista carduri din set
// ----------------------------------------------------------------
interface CardsViewProps {
  set: FlashcardSetDto;
  onBack: () => void;
  onStartReview: () => void;
}

const CardsView = ({ set, onBack, onStartReview }: CardsViewProps) => {
  const { userId } = useAuthStore();
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [stats, setStats] = useState<FlashcardSetStatsDto | null>(null);

  useEffect(() => {
    fetchCards();
    fetchStats();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const data = await getCardsForSet(set.id);
      setCards(data);
    } catch {
      // Eroare fetch
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getSetStats(set.id);
      setStats(data);
    } catch {
      // Stats optionale
    }
  };

  const handleAddCard = async (frontText: string, backText: string) => {
    if (!userId) return;
    const newCard = await createFlashcard({ setId: set.id, frontText, backText });
    setCards((prev) => [...prev, newCard]);
    await fetchStats();
  };

  const handleDeleteCard = async () => {
    if (!deleteTarget) return;
    await deleteFlashcard(deleteTarget);
    setCards((prev) => prev.filter((c) => c.id !== deleteTarget));
    setDeleteTarget(null);
    await fetchStats();
  };

  return (
    <>
      {showAddModal && (
        <AddCardModal
          setId={set.id}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCard}
        />
      )}
      {deleteTarget !== null && (
        <DeleteConfirmModal
          title="Delete Card"
          description="Are you sure you want to delete this flashcard?"
          onConfirm={handleDeleteCard}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="space-y-6">

        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#e85d04' }}
          >
            Flashcards
          </button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{set.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {set.title}
            </h2>
            {set.description && <p className="text-sm text-gray-400">{set.description}</p>}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={() => setShowAddModal(true)}
              className="h-10 px-4 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              + Add Card
            </Button>
            <Button
              onClick={onStartReview}
              disabled={!stats || stats.dueToday === 0}
              className="h-10 px-4 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              style={{ background: '#e85d04' }}
            >
              Review {stats ? `(${stats.dueToday})` : ''}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && stats.totalCards > 0 && (
          <div
            className="bg-white rounded-2xl p-4 flex items-center gap-6"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            {[
              { label: 'New', count: stats.newCards, color: '#9ca3af' },
              { label: 'Learning', count: stats.learningCards, color: '#e85d04' },
              { label: 'Mature', count: stats.matureCards, color: '#15803d' },
              { label: 'Due today', count: stats.dueToday, color: '#c1121f' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xl font-bold" style={{ color: item.color, fontFamily: 'Outfit, sans-serif' }}>
                  {item.count}
                </p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista carduri */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-400 text-sm">Loading cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-12 text-center space-y-3"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <p className="text-gray-400 text-sm">No cards yet.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90"
              style={{ background: '#e85d04' }}
            >
              Add your first card
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
              >
                <div className="flex items-center gap-6 min-w-0">
                  <span className="text-xl font-bold text-gray-800 flex-shrink-0">{card.frontText}</span>
                  <span className="text-sm text-gray-400 truncate">{card.backText}</span>
                </div>
                <button
                  onClick={() => setDeleteTarget(card.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 flex-shrink-0 ml-4 transition-all"
                  style={{ color: '#c1121f' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ----------------------------------------------------------------
// Pagina principala
// ----------------------------------------------------------------
const FlashcardsPage = () => {
  const { userId } = useAuthStore();
  const [sets, setSets] = useState<FlashcardSetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlashcardSetDto | null>(null);
  const [activeSet, setActiveSet] = useState<FlashcardSetDto | null>(null);
  const [view, setView] = useState<View>('list');

  useEffect(() => {
    if (!userId) return;
    fetchSets();
  }, [userId]);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const data = await getFlashcardSets(userId!);
      setSets(data);
    } catch {
      setError('Failed to load flashcard sets.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSet = async (title: string, description: string) => {
    const newSet = await createFlashcardSet({ title, description: description || null });
    setSets((prev) => [newSet, ...prev]);
  };

  const handleDeleteSet = async () => {
    if (!deleteTarget) return;
    await deleteFlashcardSet(deleteTarget.id);
    setSets((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleOpenSet = (set: FlashcardSetDto) => {
    setActiveSet(set);
    setView('cards');
  };

  const handleStartReview = () => {
    setView('review');
  };

  const handleBackToList = () => {
    setActiveSet(null);
    setView('list');
    fetchSets();
  };

  // Render view-uri
  if (view === 'cards' && activeSet) {
    return (
      <CardsView
        set={activeSet}
        onBack={handleBackToList}
        onStartReview={handleStartReview}
      />
    );
  }

  if (view === 'review' && activeSet) {
    return (
      <ReviewSession
        set={activeSet}
        studentId={userId!}
        onFinish={() => {
          setView('cards');
        }}
      />
    );
  }

  // View: lista seturi
  return (
    <>
      {showCreateModal && (
        <CreateSetModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSet}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Set"
          description={`Are you sure you want to delete "${deleteTarget.title}"? All cards inside will be deleted.`}
          onConfirm={handleDeleteSet}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Flashcards
            </h1>
            <p className="text-gray-400 text-sm">
              Spaced repetition review — SM-2 algorithm
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90 flex-shrink-0"
            style={{ background: '#e85d04' }}
          >
            + New Set
          </Button>
        </div>

        {/* Lista seturi */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : sets.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-16 text-center space-y-4"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <p className="text-gray-400 text-sm">No flashcard sets yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-sm font-semibold px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
              style={{ background: '#e85d04' }}
            >
              Create your first set
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-2xl p-6 space-y-4 cursor-pointer transition-all hover:shadow-md group"
                style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
                onClick={() => handleOpenSet(set)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-base font-bold text-gray-900 truncate"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {set.title}
                    </p>
                    {set.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{set.description}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(set); }}
                    className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0 transition-all"
                    style={{ color: '#c1121f' }}
                  >
                    Delete
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
                  >
                    {set.cardCount}
                  </span>
                  <span className="text-xs text-gray-400">cards</span>
                  <span
                    className="text-sm font-thin transition-transform group-hover:translate-x-0.5 ml-auto"
                    style={{ color: '#e85d04' }}
                  >
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default FlashcardsPage;