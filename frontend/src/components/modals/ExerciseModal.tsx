import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExerciseDto, ExerciseContentData } from '@/types/content';

type ExerciseType = 'MULTIPLE_CHOICE' | 'TRANSLATION' | 'FILL_BLANK' | 'MATCHING';

const EXERCISE_TYPES: { value: ExerciseType; label: string; description: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', description: 'Options with one correct answer' },
  { value: 'TRANSLATION', label: 'Translation', description: 'Translate a given text' },
  { value: 'FILL_BLANK', label: 'Fill in the Blank', description: 'Complete the missing word' },
  { value: 'MATCHING', label: 'Matching', description: 'Match characters with translations' },
];

interface ExerciseModalProps {
  lessonId: number;
  initial: Partial<ExerciseDto> | null;
  onClose: () => void;
  onSave: (data: Omit<ExerciseDto, 'id'> | Omit<ExerciseDto, 'id' | 'lessonId'>) => Promise<void>;
}

const ExerciseModal = ({ lessonId, initial, onClose, onSave }: ExerciseModalProps) => {
  const [selectedType, setSelectedType] = useState<ExerciseType>(
    (initial?.type as ExerciseType) ?? 'MULTIPLE_CHOICE'
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? '');
  const [difficulty, setDifficulty] = useState<string>(initial?.difficulty?.toString() ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mcOptions, setMcOptions] = useState<string[]>(
    (initial?.contentData as { options?: string[] })?.options ?? ['', '', '', '']
  );
  const [mcCorrectIndex, setMcCorrectIndex] = useState<number>(
    (initial?.contentData as { correctIndex?: number })?.correctIndex ?? 0
  );
  const [translationAnswers, setTranslationAnswers] = useState<string[]>(
    (initial?.contentData as { acceptedAnswers?: string[] })?.acceptedAnswers ?? ['']
  );
  
const [fillAnswers, setFillAnswers] = useState<string[]>(
  (initial?.contentData as { correctAnswers?: string[] })?.correctAnswers ?? ['']
);
  const [matchPairs, setMatchPairs] = useState<[string, string][]>(() => {
    const matches = (initial?.contentData as { matches?: Record<string, string> })?.matches;
    if (matches) return Object.entries(matches) as [string, string][];
    return [['', ''], ['', ''], ['', '']];
  });

  const updateListItem = (list: string[], setList: (v: string[]) => void, index: number, value: string) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  const addListItem = (list: string[], setList: (v: string[]) => void) => {
    setList([...list, '']);
  };

  const removeListItem = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const updateMatchPair = (index: number, side: 0 | 1, value: string) => {
    const updated: [string, string][] = matchPairs.map((pair, i) =>
      i === index ? (side === 0 ? [value, pair[1]] : [pair[0], value]) : pair
    );
    setMatchPairs(updated);
  };

const buildContentData = (): ExerciseContentData => {
  switch (selectedType) {
    case 'MULTIPLE_CHOICE':
      return { type: 'MULTIPLE_CHOICE', options: mcOptions, correctIndex: mcCorrectIndex };
    case 'TRANSLATION':
      return { type: 'TRANSLATION', acceptedAnswers: translationAnswers.filter((a) => a.trim() !== '') };
    case 'FILL_BLANK':
      return { type: 'FILL_BLANK', correctAnswers: fillAnswers.filter((a) => a.trim() !== '') };
    case 'MATCHING': {
      const pairs = matchPairs
        .filter(([k]) => k.trim() !== '')
        .map(([k, v]) => ({ left: k.trim(), right: v.trim() }));
      return { type: 'MATCHING', pairs };
    }
  }
};

  const validateContentData = (): string | null => {
    switch (selectedType) {
      case 'MULTIPLE_CHOICE':
        if (mcOptions.some((o) => o.trim() === '')) return 'All options must be filled in.';
        return null;
      case 'TRANSLATION':
        if (translationAnswers.every((a) => a.trim() === '')) return 'At least one accepted answer is required.';
        return null;
      case 'FILL_BLANK':
        if (fillAnswers.every((a) => a.trim() === '')) return 'At least one answer is required.';
        return null;
      case 'MATCHING':
        if (matchPairs.every(([k]) => k.trim() === '')) return 'At least one match pair is required.';
        return null;
    }
  };

  const handleSave = async () => {
    if (!prompt.trim()) { setError('Prompt is required.'); return; }
    const contentError = validateContentData();
    if (contentError) { setError(contentError); return; }
    setLoading(true);
    setError(null);
    try {
      const base = {
        type: selectedType,
        prompt: prompt.trim(),
        difficulty: difficulty ? parseInt(difficulty) : null,
        contentData: buildContentData(),
      };
      if (initial?.id) {
        await onSave(base);
      } else {
        await onSave({ lessonId, ...base });
      }
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {initial?.id ? 'Edit Exercise' : 'New Exercise'}
          </h2>

          {!initial?.id && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Exercise Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {EXERCISE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className="text-left p-3 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: selectedType === t.value ? '#e85d04' : '#e5e7eb',
                      background: selectedType === t.value ? '#fff7f0' : '#ffffff',
                    }}
                  >
                    <p className="text-xs font-bold" style={{ color: selectedType === t.value ? '#e85d04' : '#374151' }}>
                      {t.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt *</label>
            <Input className="h-11 rounded-xl border-gray-200 bg-gray-50" placeholder="e.g. Ce înseamnă 你好?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Difficulty (1–5)</label>
            <Input type="number" min={1} max={5} className="h-11 rounded-xl border-gray-200 bg-gray-50" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-4 pt-4" style={{ borderTop: '1px solid #f3f4f6' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {selectedType === 'MULTIPLE_CHOICE' && 'Answer Options'}
              {selectedType === 'TRANSLATION' && 'Accepted Answers'}
              {selectedType === 'FILL_BLANK' && 'Correct Answers'}
              {selectedType === 'MATCHING' && 'Match Pairs'}
            </p>

            {selectedType === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {mcOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      onClick={() => setMcCorrectIndex(i)}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: mcCorrectIndex === i ? '#e85d04' : '#d1d5db', background: mcCorrectIndex === i ? '#e85d04' : 'white' }}
                    >
                      {mcCorrectIndex === i && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                    <Input
                      className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateListItem(mcOptions, setMcOptions, i, e.target.value)}
                    />
                    {mcOptions.length > 2 && (
                      <button
                        onClick={() => { const u = mcOptions.filter((_, idx) => idx !== i); setMcOptions(u); if (mcCorrectIndex >= u.length) setMcCorrectIndex(0); }}
                        className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                        style={{ color: '#c1121f' }}
                      >✕</button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-gray-400">Click the circle to mark the correct answer.</p>
                {mcOptions.length < 6 && (
                  <button onClick={() => addListItem(mcOptions, setMcOptions)} className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all" style={{ color: '#e85d04' }}>
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {selectedType === 'TRANSLATION' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Add all accepted translations.</p>
                {translationAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1" placeholder={`Accepted answer ${i + 1}`} value={ans} onChange={(e) => updateListItem(translationAnswers, setTranslationAnswers, i, e.target.value)} />
                    {translationAnswers.length > 1 && (
                      <button onClick={() => removeListItem(translationAnswers, setTranslationAnswers, i)} className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0" style={{ color: '#c1121f' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(translationAnswers, setTranslationAnswers)} className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all" style={{ color: '#e85d04' }}>
                  + Add Variant
                </button>
              </div>
            )}

            {selectedType === 'FILL_BLANK' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Use ___ in the prompt to mark the blank.</p>
                {fillAnswers.map((ans, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1" placeholder={`Answer ${i + 1}`} value={ans} onChange={(e) => updateListItem(fillAnswers, setFillAnswers, i, e.target.value)} />
                    {fillAnswers.length > 1 && (
                      <button onClick={() => removeListItem(fillAnswers, setFillAnswers, i)} className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0" style={{ color: '#c1121f' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => addListItem(fillAnswers, setFillAnswers)} className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all" style={{ color: '#e85d04' }}>
                  + Add Answer
                </button>
              </div>
            )}

            {selectedType === 'MATCHING' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Chinese</p>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Translation</p>
                </div>
                {matchPairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1" placeholder="e.g. 水" value={pair[0]} onChange={(e) => updateMatchPair(i, 0, e.target.value)} />
                    <span className="text-gray-300 flex-shrink-0">→</span>
                    <Input className="h-10 rounded-xl border-gray-200 bg-gray-50 flex-1" placeholder="e.g. apă" value={pair[1]} onChange={(e) => updateMatchPair(i, 1, e.target.value)} />
                    {matchPairs.length > 2 && (
                      <button onClick={() => setMatchPairs(matchPairs.filter((_, idx) => idx !== i))} className="text-xs font-semibold px-2 py-1 rounded-lg hover:bg-red-50 flex-shrink-0" style={{ color: '#c1121f' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setMatchPairs([...matchPairs, ['', '']])} className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all" style={{ color: '#e85d04' }}>
                  + Add Pair
                </button>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: '#e85d04' }}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={onClose} className="flex-1 h-11 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;