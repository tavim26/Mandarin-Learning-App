import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  getLesson,
  getMaterialsByLesson,
  type LessonDto,
  type ExerciseDto,
  type LessonMaterialDto,
} from '@/api/contentApi';
import {
  submitAttempt,
  getLessonProgress,
  type ExerciseAttemptDto,
  type StudentLessonProgressDto,
} from '@/api/progressApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ----------------------------------------------------------------
// Componente per tip de exercitiu — definite in afara paginii
// ----------------------------------------------------------------

interface ExerciseProps {
  exercise: ExerciseDto;
  result: ExerciseAttemptDto | null;
  onSubmit: (answer: Record<string, unknown>) => Promise<void>;
  submitting: boolean;
}

// --- MULTIPLE CHOICE ---
const MultipleChoiceExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  const options = (exercise.contentData as { options?: string[] })?.options ?? [];
  const [selected, setSelected] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (selected === null) return;
    await onSubmit({ selectedIndex: selected });
  };

  const isCorrect = result?.isCorrect ?? null;

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
          style={{
            background: isCorrect ? '#f0fdf4' : '#fef2f2',
            color: isCorrect ? '#15803d' : '#c1121f',
          }}
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

// --- TRANSLATION ---
const TranslationExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  const [value, setValue] = useState('');
  const isCorrect = result?.isCorrect ?? null;

  const handleSubmit = async () => {
    if (!value.trim()) return;
    await onSubmit({ translation: value.trim() });
  };

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-xl text-lg font-medium text-center"
        style={{ background: '#fff7f0', color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
      >
        {exercise.prompt.replace('Traduce în română: ', '').replace('Translate: ', '')}
      </div>

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
          style={{
            background: isCorrect ? '#f0fdf4' : '#fef2f2',
            color: isCorrect ? '#15803d' : '#c1121f',
          }}
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

  // Tile-urile disponibile — amestecate, pot fi duplicate daca exista raspunsuri identice
  const [availableTiles, setAvailableTiles] = useState<string[]>(
    () => [...correctAnswers].sort(() => Math.random() - 0.5)
  );

  // Raspunsurile plasate in blank-uri — null inseamna gol
  const [placed, setPlaced] = useState<(string | null)[]>(
    Array(blanksCount).fill(null)
  );

  const isCorrect = result?.isCorrect ?? null;
  const allFilled = placed.every((p) => p !== null);

  // Click pe tile disponibil — il plaseaza in primul blank gol
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

  // Click pe blank completat — returneaza tile-ul in pool
  const handleBlankClick = (blankIndex: number) => {
    if (isCorrect) return;
    const tile = placed[blankIndex];
    if (!tile) return;

    const newPlaced = [...placed];
    newPlaced[blankIndex] = null;
    setPlaced(newPlaced);
    setAvailableTiles((prev) => [...prev, tile]);
  };

  // Reset complet
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

      {/* Prompt cu blank-uri clickabile */}
      <div
        className="p-5 rounded-xl text-base leading-loose"
        style={{ background: '#f9fafb' }}
      >
        {parts.map((part, i) => (
          <span key={i} className="align-middle">
            <span className="text-gray-700">{part}</span>
            {i < parts.length - 1 && (
              <button
                onClick={() => handleBlankClick(i)}
                className="inline-flex items-center justify-center mx-2 px-4 py-1 rounded-xl border-2 min-w-16 text-base font-bold align-middle transition-all"
                style={{
                  minWidth: '80px',
                  height: '40px',
                  borderColor: result
                    ? isCorrect ? '#15803d' : '#c1121f'
                    : placed[i] ? '#e85d04' : '#d1d5db',
                  background: result
                    ? isCorrect ? '#f0fdf4' : '#fef2f2'
                    : placed[i] ? '#fff7f0' : '#ffffff',
                  color: result
                    ? isCorrect ? '#15803d' : '#c1121f'
                    : placed[i] ? '#e85d04' : '#9ca3af',
                  borderStyle: placed[i] ? 'solid' : 'dashed',
                  cursor: placed[i] && !isCorrect ? 'pointer' : 'default',
                }}
              >
                {placed[i] ?? ''}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Pool de tile-uri disponibile */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400">
          {isCorrect ? '' : 'Click a tile to place it in the blank. Click a filled blank to return it.'}
        </p>
        <div className="flex flex-wrap gap-2 min-h-12">
          {availableTiles.map((tile, i) => (
            <button
              key={`${tile}-${i}`}
              onClick={() => handleTileClick(tile, i)}
              disabled={isCorrect === true || placed.every((p) => p !== null)}
              className="px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all hover:opacity-80 active:scale-95"
              style={{
                borderColor: '#e85d04',
                background: '#fff7f0',
                color: '#e85d04',
                opacity: placed.every((p) => p !== null) ? 0.4 : 1,
              }}
            >
              {tile}
            </button>
          ))}
          {availableTiles.length === 0 && !isCorrect && (
            <p className="text-xs text-gray-400 self-center">
              All tiles placed. Click a blank to return a tile.
            </p>
          )}
        </div>
      </div>

      {/* Feedback */}
      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{
            background: isCorrect ? '#f0fdf4' : '#fef2f2',
            color: isCorrect ? '#15803d' : '#c1121f',
          }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}

      {/* Butoane */}
      {(!result || !isCorrect) && (
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
          >
            Reset
          </button>
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

// --- MATCHING ---
const MatchingExercise = ({ exercise, result, onSubmit, submitting }: ExerciseProps) => {
  // Citeste din noul format "pairs"
  const pairs = (exercise.contentData as { pairs?: { left: string; right: string }[] })?.pairs ?? [];
  const keys = pairs.map((p) => p.left);
  const values = pairs.map((p) => p.right);
  const correctMatches = Object.fromEntries(pairs.map((p) => [p.left, p.right]));

  // Restul componentei ramane identic
  // Amesteca valorile pentru afisare
  const [shuffledValues] = useState(() => [...values].sort(() => Math.random() - 0.5));
  const [userMatches, setUserMatches] = useState<Record<string, string>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const isCorrect = result?.isCorrect ?? null;

  const handleKeyClick = (key: string) => {
    if (isCorrect) return;
    setSelectedKey(selectedKey === key ? null : key);
  };

  const handleValueClick = (value: string) => {
    if (!selectedKey || isCorrect) return;
    setUserMatches((prev) => ({ ...prev, [selectedKey]: value }));
    setSelectedKey(null);
  };

  const handleSubmit = async () => {
    if (Object.keys(userMatches).length < keys.length) return;
    await onSubmit({ matches: userMatches });
  };

  const allMatched = Object.keys(userMatches).length === keys.length;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Click a Chinese character, then click its translation to match them.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Coloana stanga — chei */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
            Chinese
          </p>
          {keys.map((key) => {
            const isSelected = selectedKey === key;
            const isMatched = userMatches[key] !== undefined;
            const matchCorrect = result && correctMatches[key] === userMatches[key];

            return (
              <button
                key={key}
                onClick={() => handleKeyClick(key)}
                className="w-full p-3 rounded-xl border-2 text-center font-bold text-lg transition-all"
                style={{
                  borderColor: result
                    ? matchCorrect ? '#15803d' : '#c1121f'
                    : isSelected ? '#e85d04'
                    : isMatched ? '#9ca3af'
                    : '#e5e7eb',
                  background: result
                    ? matchCorrect ? '#f0fdf4' : '#fef2f2'
                    : isSelected ? '#fff7f0'
                    : isMatched ? '#f9fafb'
                    : '#ffffff',
                  color: isSelected ? '#e85d04' : '#374151',
                }}
              >
                {key}
                {isMatched && !isSelected && (
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">
                    → {userMatches[key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Coloana dreapta — valori amestecate */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
            Translation
          </p>
          {shuffledValues.map((val) => {
            const isUsed = Object.values(userMatches).includes(val);

            return (
              <button
                key={val}
                onClick={() => handleValueClick(val)}
                disabled={isUsed || isCorrect === true}
                className="w-full p-3 rounded-xl border-2 text-center text-sm font-medium transition-all"
                style={{
                  borderColor: selectedKey && !isUsed ? '#0369a1' : '#e5e7eb',
                  background: selectedKey && !isUsed ? '#f0f9ff' : isUsed ? '#f9fafb' : '#ffffff',
                  color: isUsed ? '#9ca3af' : '#374151',
                  opacity: isUsed ? 0.6 : 1,
                }}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {result && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{
            background: isCorrect ? '#f0fdf4' : '#fef2f2',
            color: isCorrect ? '#15803d' : '#c1121f',
          }}
        >
          {result.feedbackText ?? (isCorrect ? 'Correct!' : 'Incorrect. Try again!')}
        </div>
      )}

      {(!result || !isCorrect) && (
        <div className="flex gap-3">
          <button
            onClick={() => { setUserMatches({}); setSelectedKey(null); }}
            className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all"
          >
            Reset
          </button>
          <Button
            onClick={handleSubmit}
            disabled={!allMatched || submitting}
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

// ----------------------------------------------------------------
// Pagina principala
// ----------------------------------------------------------------

const StudentLessonPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const parsedLessonId = parseInt(lessonId ?? '0');
  const { userId } = useAuthStore();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [materials, setMaterials] = useState<LessonMaterialDto[]>([]);
  const [progress, setProgress] = useState<StudentLessonProgressDto | null>(null);
  const [results, setResults] = useState<Record<number, ExerciseAttemptDto>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  const exercises: ExerciseDto[] = lesson?.exercises ?? [];

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [parsedLessonId, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lessonData, materialsData] = await Promise.all([
        getLesson(parsedLessonId),
        getMaterialsByLesson(parsedLessonId),
      ]);
      setLesson(lessonData);
      setMaterials(materialsData);

      // Fetch progres curent — poate sa nu existe (404)
      const progressData = await getLessonProgress(userId!, parsedLessonId).catch(() => null);
      setProgress(progressData);
    } catch {
      setError('Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answer: Record<string, unknown>) => {
    if (!exercises[currentIndex]) return;
    const exercise = exercises[currentIndex];
    setSubmitting(true);
    try {
      const result = await submitAttempt({ exerciseId: exercise.id, submittedAnswer: answer });
      const updatedResults = { ...results, [exercise.id]: result };
      setResults(updatedResults);

      // Refresh progres dupa fiecare submit
      const progressData = await getLessonProgress(userId!, parsedLessonId).catch(() => null);
      setProgress(progressData);

      // Verifica daca toate exercitiile sunt rezolvate corect
      const allCorrect = exercises.every(
        (ex) => updatedResults[ex.id]?.isCorrect === true
      );
      if (allCorrect) setShowCompletion(true);
    } catch {
      // Eroare de retea — nu blocam UI-ul
    } finally {
      setSubmitting(false);
    }
  };

  const renderExercise = (exercise: ExerciseDto) => {
    const result = results[exercise.id] ?? null;
    const props = { exercise, result, onSubmit: handleSubmit, submitting };

    switch (exercise.type) {
      case 'MULTIPLE_CHOICE': return <MultipleChoiceExercise {...props} />;
      case 'TRANSLATION': return <TranslationExercise {...props} />;
      case 'FILL_BLANK': return <FillBlankExercise {...props} />;
      case 'MATCHING': return <MatchingExercise {...props} />;
      default: return (
        <p className="text-sm text-gray-400">
          Exercise type "{exercise.type}" is not supported yet.
        </p>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">{error ?? 'Lesson not found.'}</p>
      </div>
    );
  }

  const currentExercise = exercises[currentIndex];
  const completedCount = exercises.filter((ex) => results[ex.id]?.isCorrect).length;
  const lessonPct = progress?.completionPct ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Breadcrumb */}
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

      {/* Header lectie */}
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

        {/* Progress bar lectie */}
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
              style={{
                width: `${lessonPct}%`,
                background: lessonPct === 100 ? '#15803d' : '#e85d04',
              }}
            />
          </div>
        </div>
      </div>

      {/* Banner completare lectie */}
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

      {/* Materiale lectie */}
      {materials.length > 0 && (
        <div
          className="bg-white rounded-2xl p-5 space-y-3"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p
            className="text-sm font-bold text-gray-900"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
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

      {/* Sectiunea exercitii */}
      {exercises.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-400 text-sm">No exercises in this lesson yet.</p>
        </div>
      ) : (
        <div className="space-y-4">

          {/* Navigare pills — numerotate ca Moodle */}
          <div className="flex flex-wrap gap-2">
            {exercises.map((ex, i) => {
              const isCorrect = results[ex.id]?.isCorrect;
              const hasAttempt = results[ex.id] !== undefined;
              const isCurrent = i === currentIndex;

              let bg = '#ffffff';
              let border = '#e5e7eb';
              let color = '#6b7280';

              if (isCurrent) { border = '#e85d04'; color = '#e85d04'; bg = '#fff7f0'; }
              else if (isCorrect) { border = '#15803d'; color = '#15803d'; bg = '#f0fdf4'; }
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
            {/* Header exercitiu */}
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
              <p
                className="text-lg font-semibold text-gray-900"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {currentExercise.prompt}
              </p>
            </div>

            {/* UI specific tipului */}
            {renderExercise(currentExercise)}
          </div>

          {/* Navigare Previous / Next */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-xs text-gray-400">
              {currentIndex + 1} of {exercises.length}
            </span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(exercises.length - 1, i + 1))}
              disabled={currentIndex === exercises.length - 1}
              className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentLessonPage;