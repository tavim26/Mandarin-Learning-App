import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useLesson, useMaterials } from '@/hooks/useContent';
import { useLessonProgress, useExerciseAttempts } from '@/hooks/useProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChineseText from '@/components/ChineseText';
import type { ExerciseDto, ExerciseAttemptDto } from '@/types';

// ----------------------------------------------------------------
// Componente per tip de exercitiu — UI pur, fara logica de fetch
// ----------------------------------------------------------------

interface ExerciseProps {
  exercise: ExerciseDto;
  result: ExerciseAttemptDto | null;
  onSubmit: (answer: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}

const MultipleChoiceExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  const options = (exercise.contentData as { options?: string[] })?.options ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const isCorrect = result?.isCorrect ?? null;

  const handleSubmit = async () => {
    if (selected === null) return;
    await onSubmit({ selectedIndex: selected });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {options.map((opt, i) => {
          let borderColor = '#e5e7eb';
          let bg = '#ffffff';
          let textColor = '#374151';

          if (result !== null) {
            const correctIndex = (exercise.contentData as { correctIndex?: number })?.correctIndex;
            if (i === correctIndex) { borderColor = '#15803d'; bg = '#f0fdf4'; textColor = '#15803d'; }
            else if (i === selected && !isCorrect) { borderColor = '#c1121f'; bg = '#fef2f2'; textColor = '#c1121f'; }
          } else if (selected === i) {
            borderColor = '#e85d04'; bg = '#fff7f0'; textColor = '#e85d04';
          }

          return (
            <button
              key={i}
              onClick={() => { if (!result || !isCorrect) setSelected(i); }}
              className="w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium"
              style={{ borderColor, background: bg, color: textColor }}
            >
              <span className="font-bold mr-3">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{ background: isCorrect ? '#f0fdf4' : '#fef2f2', color: isCorrect ? '#15803d' : '#c1121f' }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}
      {(!result || !isCorrect) && (
        <Button
          onClick={handleSubmit}
          disabled={selected === null || submitting}
          className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          {submitting ? 'Checking...' : 'Submit'}
        </Button>
      )}
    </div>
  );
};

const TranslationExercise = ({ result, onSubmit, submitting }: ExerciseProps) => {
  const [value, setValue] = useState('');
  const isCorrect = result?.isCorrect ?? null;

  const handleSubmit = async () => {
    if (!value.trim()) return;
    await onSubmit({ translation: value.trim() });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Your translation..."
        className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !isCorrect) handleSubmit(); }}
        disabled={isCorrect === true}
      />
      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{ background: isCorrect ? '#f0fdf4' : '#fef2f2', color: isCorrect ? '#15803d' : '#c1121f' }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}
      {(!result || !isCorrect) && (
        <Button
          onClick={handleSubmit}
          disabled={!value.trim() || submitting}
          className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          {submitting ? 'Checking...' : 'Submit'}
        </Button>
      )}
    </div>
  );
};

const FillBlankExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  const correctAnswers = (exercise.contentData as { correctAnswers?: string[] })?.correctAnswers ?? [];
  const parts = exercise.prompt.split('___');
  const blanksCount = parts.length - 1;

  const [availableTiles, setAvailableTiles] = useState<string[]>(
    () => [...correctAnswers].sort(() => Math.random() - 0.5)
  );
  const [placed, setPlaced] = useState<(string | null)[]>(Array(blanksCount).fill(null));

  const isCorrect = result?.isCorrect ?? null;
  const allFilled = placed.every((p) => p !== null);

  const handleTileClick = (tile: string, tileIndex: number) => {
    if (isCorrect) return;
    const firstEmpty = placed.findIndex((p) => p === null);
    if (firstEmpty === -1) return;
    const newPlaced = [...placed];
    newPlaced[firstEmpty] = tile;
    setPlaced(newPlaced);
    const newTiles = [...availableTiles];
    newTiles.splice(tileIndex, 1);
    setAvailableTiles(newTiles);
  };

  const handleBlankClick = (blankIndex: number) => {
    if (isCorrect) return;
    const tile = placed[blankIndex];
    if (!tile) return;
    const newPlaced = [...placed];
    newPlaced[blankIndex] = null;
    setPlaced(newPlaced);
    setAvailableTiles((prev) => [...prev, tile]);
  };

  const handleReset = () => {
    setPlaced(Array(blanksCount).fill(null));
    setAvailableTiles([...correctAnswers].sort(() => Math.random() - 0.5));
  };

  const handleSubmit = async () => {
    if (!allFilled) return;
    await onSubmit({ answers: placed as string[] });
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl text-base leading-loose" style={{ background: '#f9fafb' }}>
        {parts.map((part, i) => {
          const displayPart = i === 0 ? part.replace(/^Completea[zz]ă?:\s*/i, '') : part;
          return (
            <span key={i} className="align-middle">
              <ChineseText text={displayPart} />
              {i < parts.length - 1 && (
                <button
                  onClick={() => handleBlankClick(i)}
                  className="inline-flex items-center justify-center mx-2 px-4 py-1 rounded-xl border-2 min-w-16 text-base font-bold align-middle transition-all"
                  style={{
                    minWidth: '80px',
                    height: '40px',
                    borderColor: placed[i] ? (isCorrect ? '#15803d' : '#e85d04') : '#d1d5db',
                    background: placed[i] ? (isCorrect ? '#f0fdf4' : '#fff7f0') : '#ffffff',
                    color: placed[i] ? (isCorrect ? '#15803d' : '#e85d04') : '#9ca3af',
                  }}
                >
                  {placed[i] ?? '?'}
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Tile-uri disponibile */}
      <div className="flex flex-wrap gap-2">
        {availableTiles.map((tile, i) => (
          <button
            key={i}
            onClick={() => handleTileClick(tile, i)}
            disabled={!!isCorrect}
            className="px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all hover:border-orange-400 hover:bg-orange-50 disabled:opacity-50"
            style={{ borderColor: '#e5e7eb', background: '#ffffff', color: '#374151' }}
          >
            {tile}
          </button>
        ))}
      </div>

      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{ background: isCorrect ? '#f0fdf4' : '#fef2f2', color: isCorrect ? '#15803d' : '#c1121f' }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}

      {!isCorrect && (
        <div className="flex gap-3">
          <Button
            onClick={handleReset}
            className="h-11 px-5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: '#e85d04' }}
          >
            {submitting ? 'Checking...' : 'Submit'}
          </Button>
        </div>
      )}
    </div>
  );
};

const MatchingExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  const pairs = (exercise.contentData as { pairs?: { left: string; right: string }[] })?.pairs ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const isCorrect = result?.isCorrect ?? null;

  const [rightItems] = useState<string[]>(
  () => [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)
);
  const allMatched = Object.keys(matches).length === pairs.length;

  const handleLeftClick = (left: string) => {
    if (isCorrect) return;
    setSelected(left);
  };

  const handleRightClick = (right: string) => {
    if (!selected || isCorrect) return;
    setMatches((prev) => ({ ...prev, [selected]: right }));
    setSelected(null);
  };

  const handleSubmit = async () => {
    if (!allMatched) return;
    await onSubmit({ matches });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {pairs.map((pair) => (
            <button
              key={pair.left}
              onClick={() => handleLeftClick(pair.left)}
              className="w-full p-3 rounded-xl border-2 text-sm font-bold text-left transition-all"
              style={{
                borderColor: selected === pair.left ? '#e85d04' : matches[pair.left] ? '#15803d' : '#e5e7eb',
                background: selected === pair.left ? '#fff7f0' : matches[pair.left] ? '#f0fdf4' : '#ffffff',
                color: selected === pair.left ? '#e85d04' : matches[pair.left] ? '#15803d' : '#374151',
              }}
            >
              {pair.left}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rightItems.map((right) => (
            <button
              key={right}
              onClick={() => handleRightClick(right)}
              className="w-full p-3 rounded-xl border-2 text-sm font-medium text-left transition-all"
              style={{
                borderColor: Object.values(matches).includes(right) ? '#15803d' : '#e5e7eb',
                background: Object.values(matches).includes(right) ? '#f0fdf4' : '#f9fafb',
                color: Object.values(matches).includes(right) ? '#15803d' : '#374151',
              }}
            >
              {right}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{ background: isCorrect ? '#f0fdf4' : '#fef2f2', color: isCorrect ? '#15803d' : '#c1121f' }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}

      {!isCorrect && (
        <Button
          onClick={handleSubmit}
          disabled={!allMatched || submitting}
          className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90"
          style={{ background: '#e85d04' }}
        >
          {submitting ? 'Checking...' : 'Submit'}
        </Button>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Pagina principala
// ----------------------------------------------------------------

const StudentLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const parsedLessonId = parseInt(lessonId ?? '0');

  // --- Hooks (ViewModel) ---
  const { lesson, loading: lessonLoading, error: lessonError } = useLesson(parsedLessonId);
  const { materials } = useMaterials(parsedLessonId);
  const { progress, refetch: refetchProgress } = useLessonProgress(userId!, parsedLessonId);
  const { submit, submitting } = useExerciseAttempts();

  // --- Stare UI (View) ---
  const [results, setResults] = useState<Record<number, ExerciseAttemptDto>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const exercises = lesson?.exercises ?? [];

  const handleSubmit = async (exerciseId: number, answer: Record<string, unknown>) => {
    const result = await submit({
      exerciseId,
      submittedAnswer: answer as never,
    });
    setResults((prev) => ({ ...prev, [exerciseId]: result }));

    // Refresheaza progresul dupa fiecare tentativa corecta
    const updated = await refetchProgress();
    if (updated?.status === 'COMPLETED' && !showCompletion) {
      setShowCompletion(true);
    }
  };

  const renderExercise = (exercise: ExerciseDto) => {
    const props: ExerciseProps = {
      exercise,
      result: results[exercise.id] ?? null,
      onSubmit: (answer) => handleSubmit(exercise.id, answer),
      submitting,
    };
    switch (exercise.type) {
      case 'MULTIPLE_CHOICE': return <MultipleChoiceExercise {...props} />;
      case 'TRANSLATION':     return <TranslationExercise {...props} />;
      case 'FILL_BLANK':      return <FillBlankExercise {...props} />;
      case 'MATCHING':        return <MatchingExercise {...props} />;
      default:                return <p className="text-sm text-gray-400">Unknown exercise type.</p>;
    }
  };

  if (lessonLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{lessonError ?? 'Lesson not found.'}</p>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex];
  const completedCount = exercises.filter((ex) => results[ex.id]?.isCorrect).length;
  const lessonPct = progress?.completionPct ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/lessons"
          className="font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#e85d04' }}
        >
          Lessons
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-500 truncate">{lesson.title}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-3xl font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {lesson.title}
          </h1>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{ background: '#f0fdf4', color: '#15803d' }}
          >
            +{lesson.xpReward} XP
          </span>
        </div>
        {lesson.description && (
          <p className="text-gray-400 text-sm">{lesson.description}</p>
        )}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {completedCount} / {exercises.length} exercises completed
            </span>
            <span
              className="text-xs font-semibold"
              style={{ color: lessonPct === 100 ? '#15803d' : '#e85d04' }}
            >
              {Math.round(lessonPct)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${lessonPct}%`, background: lessonPct === 100 ? '#15803d' : '#e85d04' }}
            />
          </div>
        </div>
      </div>

      {showCompletion && (
        <div
          className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: '#f0fdf4', border: '2px solid #15803d' }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: '#15803d', fontFamily: 'Outfit, sans-serif' }}
          >
            Lesson Complete!
          </p>
          <p className="text-sm text-gray-600">
            You earned <span className="font-bold" style={{ color: '#15803d' }}>+{lesson.xpReward} XP</span>
          </p>
          <button
            onClick={() => navigate('/lessons')}
            className="text-sm font-semibold px-6 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
            style={{ background: '#15803d' }}
          >
            Back to Lessons
          </button>
        </div>
      )}

  {materials.length > 0 && (
  <div
    className="bg-white rounded-2xl p-5 space-y-3"
    style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
  >
    <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
      Learning Materials
    </p>
    <div className="flex flex-wrap gap-2">
      {materials.map((mat) => (
        
        <a
          key={mat.id}
          href={mat.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: '#f0f9ff', color: '#0369a1' }}
        >
          <span>{mat.type || 'LINK'}</span>
          <span>— {mat.title}</span>
        </a>
      ))}
    </div>
  </div>
)}

      {exercises.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-400 text-sm">No exercises in this lesson yet.</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Pills navigare exercitii */}
          <div className="flex flex-wrap gap-2">
            {exercises.map((ex, i) => {
              const isCorrect = results[ex.id]?.isCorrect;
              const hasAttempt = results[ex.id] !== undefined;
              const isCurrent = i === currentIndex;

              let bg = '#ffffff';
              let border = '#e5e7eb';
              let color = '#6b7280';

              if (isCurrent)                    { border = '#e85d04'; color = '#e85d04'; bg = '#fff7f0'; }
              else if (isCorrect)               { border = '#15803d'; color = '#15803d'; bg = '#f0fdf4'; }
              else if (hasAttempt && !isCorrect) { border = '#c1121f'; color = '#c1121f'; bg = '#fef2f2'; }

              return (
                <button
                  key={ex.id}
                  onClick={() => setCurrentIndex(i)}
                  className="w-9 h-9 rounded-xl border-2 text-sm font-bold transition-all"
                  style={{ background: bg, borderColor: border, color }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Card exercitiu curent */}
          <div
            className="bg-white rounded-2xl p-8 space-y-6"
            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-md"
                  style={{ background: '#fff7f0', color: '#e85d04' }}
                >
                  {currentExercise.type}
                </span>
                {currentExercise.difficulty && (
                  <span className="text-xs text-gray-400">
                    Difficulty: {currentExercise.difficulty}/5
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <ChineseText text={currentExercise.prompt} />
              </p>
            </div>
            {renderExercise(currentExercise)}
          </div>

          {/* Navigare Previous / Next */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">
              {currentIndex + 1} of {exercises.length}
            </span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={currentIndex === exercises.length - 1}
              className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentLessonPage;