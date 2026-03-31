import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  analyzeText,
  analyzeOcr,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getStudentStats,
  type TextAnalysisDto,
  type TextAnalysisSummaryDto,
  type StudentStatsDto,
} from '@/api/analysisApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

import useTTS from '@/hooks/useTTS';

// ----------------------------------------------------------------
// Tipuri tab
// ----------------------------------------------------------------
type Tab = 'analyze' | 'history' | 'stats';

// ----------------------------------------------------------------
// Componenta afisare rezultat analiza — tokeni cu pinyin ruby
// ----------------------------------------------------------------

// --- Modal creare flashcard din token ---
interface CreateFlashcardFromTokenModalProps {
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  onClose: () => void;
}

const CreateFlashcardFromTokenModal = ({
  hanzi, pinyin, translation, onClose,
}: CreateFlashcardFromTokenModalProps) => {
  const { userId } = useAuthStore();
  const [sets, setSets] = useState<import('@/api/flashcardApi').FlashcardSetDto[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [frontText, setFrontText] = useState(hanzi);
  const [backText, setBackText] = useState(
    [pinyin, translation].filter(Boolean).join(' — ')
  );
  const [loading, setLoading] = useState(false);
  const [loadingSets, setLoadingSets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSets = async () => {
      if (!userId) return;
      try {
        const { getFlashcardSets } = await import('@/api/flashcardApi');
        const data = await getFlashcardSets(userId);
        setSets(data);
        if (data.length > 0) setSelectedSetId(data[0].id);
      } catch {
        setError('Failed to load flashcard sets.');
      } finally {
        setLoadingSets(false);
      }
    };
    fetchSets();
  }, [userId]);

  const handleSave = async () => {
    if (!selectedSetId) { setError('Please select a set.'); return; }
    if (!frontText.trim() || !backText.trim()) { setError('Front and back text are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { createFlashcard } = await import('@/api/flashcardApi');
      await createFlashcard({ setId: selectedSetId, frontText: frontText.trim(), backText: backText.trim() });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('Failed to create flashcard.');
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
          Add to Flashcards
        </h2>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-2xl">✓</p>
            <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
              Flashcard created!
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Selector set */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Flashcard Set
              </label>
              {loadingSets ? (
                <p className="text-xs text-gray-400">Loading sets...</p>
              ) : sets.length === 0 ? (
                <p className="text-xs text-red-500">
                  No sets found. Create a set in the Flashcards section first.
                </p>
              ) : (
                <select
                  value={selectedSetId ?? ''}
                  onChange={(e) => setSelectedSetId(parseInt(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none"
                >
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.cardCount} cards)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Front */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Front (Chinese)
              </label>
              <input
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none"
                value={frontText}
                onChange={(e) => setFrontText(e.target.value)}
              />
            </div>

            {/* Back */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Back (Pinyin + Translation)
              </label>
              <input
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none"
                value={backText}
                onChange={(e) => setBackText(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || sets.length === 0}
                className="flex-1 h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: '#e85d04' }}
              >
                {loading ? 'Saving...' : 'Add Card'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnalysisResultProps {
  result: TextAnalysisDto;
}

const HSK_COLORS: Record<number, string> = {
  1: '#15803d',
  2: '#0369a1',
  3: '#7c3aed',
  4: '#c2410c',
  5: '#b45309',
  6: '#be123c',
};

const AnalysisResult = ({ result }: AnalysisResultProps) => {
  const sorted = [...result.tokens].sort((a, b) => a.position_index - b.position_index);
  const fullText = sorted.map((t) => t.hanzi).join('');

  // Stare tooltip token
  const [tooltipToken, setTooltipToken] = useState<{
    token: typeof sorted[0];
    x: number;
    y: number;
  } | null>(null);
  const [flashcardToken, setFlashcardToken] = useState<typeof sorted[0] | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking, stop } = useTTS();

  // Inchide tooltip la click in afara
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltipToken(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenClick = (token: typeof sorted[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    if (tooltipToken?.token.hanzi === token.hanzi) {
      setTooltipToken(null);
      return;
    }
    setTooltipToken({ token, x: rect.left + rect.width / 2, y: rect.top - 8 });
  };

  return (
    <>
      {/* Modal creare flashcard */}
      {flashcardToken && (
        <CreateFlashcardFromTokenModal
          hanzi={flashcardToken.hanzi}
          pinyin={flashcardToken.pinyin}
          translation={flashcardToken.translation}
          onClose={() => setFlashcardToken(null)}
        />
      )}

      {/* Tooltip token */}
      {tooltipToken && (
        <div
          ref={tooltipRef}
          className="fixed z-50"
          style={{
            left: `${tooltipToken.x}px`,
            top: `${tooltipToken.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="bg-white rounded-2xl p-4 space-y-3 min-w-52"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #f3f4f6' }}
          >
            {/* Header — hanzi + audio */}
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-2xl font-bold"
                style={{ color: tooltipToken.token.hsk_level ? HSK_COLORS[tooltipToken.token.hsk_level] ?? '#374151' : '#374151', fontFamily: 'Outfit, sans-serif' }}
              >
                {tooltipToken.token.hanzi}
              </span>
              <button
                onClick={() => isSpeaking ? stop() : speak(tooltipToken.token.hanzi)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                style={{
                  background: isSpeaking ? '#fff7f0' : '#f9fafb',
                  border: `1.5px solid ${isSpeaking ? '#e85d04' : '#e5e7eb'}`,
                  color: isSpeaking ? '#e85d04' : '#6b7280',
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
            </div>

            {/* Pinyin */}
            {tooltipToken.token.pinyin && (
              <p className="text-sm font-medium" style={{ color: '#e85d04' }}>
                {tooltipToken.token.pinyin}
              </p>
            )}

            {/* Traducere */}
            {tooltipToken.token.translation && (
              <p className="text-sm text-gray-600">{tooltipToken.token.translation}</p>
            )}

            {/* HSK badge */}
            {tooltipToken.token.hsk_level && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md inline-block"
                style={{
                  background: `${HSK_COLORS[tooltipToken.token.hsk_level]}18`,
                  color: HSK_COLORS[tooltipToken.token.hsk_level],
                }}
              >
                HSK {tooltipToken.token.hsk_level}
              </span>
            )}

            {/* Buton adaugare flashcard */}
            <button
              onClick={() => { setFlashcardToken(tooltipToken.token); setTooltipToken(null); }}
              className="w-full h-9 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: '#e85d04' }}
            >
              + Add to Flashcards
            </button>

            {/* Triunghi */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"
              style={{ bottom: '-6px', border: '1px solid #f3f4f6', borderTop: 'none', borderLeft: 'none' }}
            />
          </div>
        </div>
      )}

      <div className="space-y-5">

        {/* Metadata + buton audio text complet */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{ background: result.source_type === 'OCR' ? '#f0f9ff' : '#f0fdf4', color: result.source_type === 'OCR' ? '#0369a1' : '#15803d' }}
          >
            {result.source_type}
          </span>
          {result.overall_hsk_level && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ background: '#fff7f0', color: '#e85d04' }}
            >
              Overall HSK {result.overall_hsk_level}
            </span>
          )}
          <span className="text-xs text-gray-400">{sorted.length} tokens</span>

          {/* Buton play audio text complet */}
          <button
            onClick={() => isSpeaking ? stop() : speak(fullText)}
            className="ml-auto flex items-center gap-2 h-8 px-3 rounded-xl border-2 text-xs font-semibold transition-all"
            style={{
              borderColor: isSpeaking ? '#e85d04' : '#e5e7eb',
              background: isSpeaking ? '#fff7f0' : '#ffffff',
              color: isSpeaking ? '#e85d04' : '#6b7280',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            {isSpeaking ? 'Stop' : 'Play all'}
          </button>
        </div>

        {/* Tokeni clickabili cu ruby text */}
        <div
          className="p-5 rounded-2xl leading-loose"
          style={{ background: '#f9fafb', lineHeight: '2.8' }}
        >
          {sorted.map((token, i) => (
            <ruby
              key={i}
              onClick={(e) => handleTokenClick(token, e)}
              className="mx-0.5 text-xl font-medium cursor-pointer rounded px-0.5 transition-all hover:bg-orange-50"
              style={{ color: token.hsk_level ? HSK_COLORS[token.hsk_level] ?? '#374151' : '#374151' }}
            >
              {token.hanzi}
              <rt className="text-xs font-normal" style={{ color: '#9ca3af' }}>
                {token.pinyin ?? ''}
              </rt>
            </ruby>
          ))}
        </div>

        {/* Traducere globala */}
        {result.translated_text && (
          <div
            className="p-4 rounded-xl text-sm text-gray-600"
            style={{ background: '#f0f9ff', borderLeft: '3px solid #0369a1' }}
          >
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Translation
            </span>
            {result.translated_text}
          </div>
        )}

        {/* Legenda culori HSK */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(HSK_COLORS).map(([level, color]) => (
            <span
              key={level}
              className="text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ background: `${color}18`, color }}
            >
              HSK {level}
            </span>
          ))}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: '#f3f4f6', color: '#6b7280' }}
          >
            No HSK
          </span>
        </div>
      </div>
    </>
  );
};

// ----------------------------------------------------------------
// Tab: Analyze
// ----------------------------------------------------------------
const AnalyzeTab = () => {
  const [mode, setMode] = useState<'text' | 'ocr'>('text');
  const [textInput, setTextInput] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState<'ro' | 'en'>('ro');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TextAnalysisDto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: TextAnalysisDto;
      if (mode === 'text') {
        if (!textInput.trim()) { setError('Please enter some text.'); setLoading(false); return; }
        data = await analyzeText(textInput.trim(), translationLanguage);
      } else {
        if (!imageFile) { setError('Please select an image.'); setLoading(false); return; }
        data = await analyzeOcr(imageFile, translationLanguage);
      }
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('422')) {
        setError('No Chinese text detected in the image.');
      } else if (err instanceof Error && err.message.includes('503')) {
        setError('Translation service unavailable. Try again.');
      } else {
        setError('Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Selector mod */}
      <div className="flex gap-2">
        {(['text', 'ocr'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(null); }}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all border-2"
            style={{
              borderColor: mode === m ? '#e85d04' : '#e5e7eb',
              background: mode === m ? '#fff7f0' : '#ffffff',
              color: mode === m ? '#e85d04' : '#6b7280',
            }}
          >
            {m === 'text' ? 'Text Input' : 'Image / OCR'}
          </button>
        ))}

        {/* Selector limba traducere */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Translate to:</span>
          <div className="flex gap-1">
            {(['ro', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setTranslationLanguage(lang)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2"
                style={{
                  borderColor: translationLanguage === lang ? '#0369a1' : '#e5e7eb',
                  background: translationLanguage === lang ? '#f0f9ff' : '#ffffff',
                  color: translationLanguage === lang ? '#0369a1' : '#9ca3af',
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === 'text' ? (
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste or type Chinese text here... e.g. 你好世界"
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base resize-none outline-none transition-all"
          style={{ fontFamily: 'inherit' }}
          onFocus={(e) => { e.target.style.borderColor = '#e85d04'; e.target.style.background = '#ffffff'; }}
          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
        />
      ) : (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleImageChange(e.target.files[0]); }}
          />
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected"
                className="w-full max-h-48 object-contain rounded-xl"
                style={{ border: '2px solid #e85d04' }}
              />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md text-gray-500 hover:text-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-orange-300 hover:bg-orange-50"
              style={{ borderColor: '#d1d5db' }}
            >
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm text-gray-400">Click to upload image</p>
              <p className="text-xs text-gray-300">JPG, PNG, etc.</p>
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="h-11 px-8 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        style={{ background: '#e85d04' }}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {result && (
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <AnalysisResult result={result} />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Tab: History
// ----------------------------------------------------------------
interface HistoryTabProps {
  studentId: number;
}

const HistoryTab = ({ studentId }: HistoryTabProps) => {
  const [items, setItems] = useState<TextAnalysisSummaryDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'MANUAL' | 'OCR' | ''>('');
  const [hskFilter, setHskFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, TextAnalysisDto>>({});
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [page, sourceFilter, hskFilter, sortOrder]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, size: 10, sort_order: sortOrder };
      if (sourceFilter) params.source_type = sourceFilter;
      if (hskFilter) params.hsk_level = parseInt(hskFilter);
      const data = await getAnalysisHistory(studentId, params as Parameters<typeof getAnalysisHistory>[1]);
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (expandedData[id]) return;
    try {
      const data = await getAnalysisById(id);
      setExpandedData((prev) => ({ ...prev, [id]: data }));
    } catch { /* ignoram */ }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAnalysis(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((prev) => prev - 1);
      setDeleteTarget(null);
      if (expandedId === id) setExpandedId(null);
    } catch { /* ignoram */ }
  };

  return (
    <div className="space-y-5">

      {/* Filtre */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value as 'MANUAL' | 'OCR' | ''); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="">All sources</option>
          <option value="MANUAL">Manual</option>
          <option value="OCR">OCR</option>
        </select>

        <select
          value={hskFilter}
          onChange={(e) => { setHskFilter(e.target.value); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="">All HSK levels</option>
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <option key={l} value={l}>HSK {l}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value as 'newest' | 'oldest'); setPage(1); }}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <span className="text-xs text-gray-400 ml-auto">{total} analyses</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <p className="text-gray-400 text-sm">No analyses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
            >
              {/* Header row */}
              <div
                className="flex items-start justify-between gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleExpand(item.id)}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.raw_text.slice(0, 60)}{item.raw_text.length > 60 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{
                        background: item.source_type === 'OCR' ? '#f0f9ff' : '#f0fdf4',
                        color: item.source_type === 'OCR' ? '#0369a1' : '#15803d',
                      }}
                    >
                      {item.source_type}
                    </span>
                    {item.overall_hsk_level && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: '#fff7f0', color: '#e85d04' }}
                      >
                        HSK {item.overall_hsk_level}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deleteTarget === item.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: '#c1121f', color: 'white' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteTarget(null)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: '#c1121f' }}
                    >
                      Delete
                    </button>
                  )}
                  <span
                    className="text-lg text-gray-300 transition-transform"
                    style={{ transform: expandedId === item.id ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  >
                    →
                  </span>
                </div>
              </div>

              {/* Expanded — tokeni completi */}
              {expandedId === item.id && (
                <div
                  className="px-5 pb-5"
                  style={{ borderTop: '1px solid #f3f4f6' }}
                >
                  {expandedData[item.id] ? (
                    <div className="pt-4">
                      <AnalysisResult result={expandedData[item.id]} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-16">
                      <p className="text-gray-400 text-sm">Loading tokens...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginare */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Tab: Stats
// ----------------------------------------------------------------
interface StatsTabProps {
  studentId: number;
}

const DONUT_COLORS = ['#e85d04', '#0369a1'];

const StatsTab = ({ studentId }: StatsTabProps) => {
  const [stats, setStats] = useState<StudentStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getStudentStats(studentId);
        setStats(data);
      } catch {
        setError('Failed to load statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Loading stats...</p>
    </div>
  );

  if (error || !stats) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-red-500 text-sm">{error ?? 'No stats available.'}</p>
    </div>
  );

  // Pregatire date pentru grafice
  const distributionData = stats.token_distribution
    .map((d) => ({
      name: d.hsk_level ? `HSK ${d.hsk_level}` : 'No HSK',
      count: d.token_count,
      fill: d.hsk_level ? HSK_COLORS[d.hsk_level] ?? '#9ca3af' : '#9ca3af',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const donutData = [
    { name: 'Manual', value: stats.source_type_split.MANUAL ?? 0 },
    { name: 'OCR', value: stats.source_type_split.OCR ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">

      {/* Grid charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Token distribution per HSK */}
        <div
          className="bg-white rounded-2xl p-6 space-y-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div>
            <h3
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Tokens by HSK Level
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              How many tokens you've encountered per level
            </p>
          </div>
          {distributionData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: '12px' }}
                  formatter={(value: number | string | undefined) => [`${value ?? 0} tokens`, 'Count']}
                  cursor={{ fill: '#fff7f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {distributionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source type split */}
        <div
          className="bg-white rounded-2xl p-6 space-y-4"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div>
            <h3
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Analysis Sources
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Manual input vs OCR image analyses
            </p>
          </div>
          {donutData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: '12px' }}
                  formatter={(value: number | string | undefined) => [`${value ?? 0} analyses`, '']}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Vocabular HSK acoperit — progress bars */}
      {stats.unique_chars_per_hsk_level.length > 0 && (
        <div
          className="bg-white rounded-2xl p-6 space-y-5"
          style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)' }}
        >
          <div>
            <h3
              className="text-base font-bold text-gray-900"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              HSK Vocabulary Coverage
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Unique characters encountered from each HSK level's word list
            </p>
          </div>
          <div className="space-y-4">
            {stats.unique_chars_per_hsk_level
              .sort((a, b) => a.hsk_level - b.hsk_level)
              .map((item) => {
                const color = HSK_COLORS[item.hsk_level] ?? '#9ca3af';
                return (
                  <div key={item.hsk_level} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ background: `${color}18`, color }}
                      >
                        HSK {item.hsk_level}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.unique_count} / {item.total_in_level} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${item.percentage}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Pagina principala
// ----------------------------------------------------------------
const AnalysisPage = () => {
  const { userId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('analyze');

  if (!userId) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'analyze', label: 'Analyze' },
    { key: 'history', label: 'History' },
    { key: 'stats', label: 'Statistics' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="space-y-1">
        <h1
          className="text-3xl font-bold text-gray-900"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Text Analysis
        </h1>
        <p className="text-gray-400 text-sm">
          Analyze Chinese text or images — get pinyin, HSK levels and translations
        </p>
      </div>

      {/* Tab-uri */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: '#f3f4f6' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.key ? '#ffffff' : 'transparent',
              color: activeTab === tab.key ? '#e85d04' : '#6b7280',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Continut tab activ */}
      <div>
        {activeTab === 'analyze' && <AnalyzeTab />}
        {activeTab === 'history' && <HistoryTab studentId={userId} />}
        {activeTab === 'stats' && <StatsTab studentId={userId} />}
      </div>

    </div>
  );
};

export default AnalysisPage;