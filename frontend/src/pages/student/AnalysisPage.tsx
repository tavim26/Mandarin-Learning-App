import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createFlashcard } from '@/api/flashcardApi';
import { useFlashcardSets } from '@/hooks/useFlashcards';
import { useAnalysis } from '@/hooks/useAnalysis';
import type { GetAnalysesParams } from '@/api/analysisApi';
import type { TextAnalysisDto } from '@/types/analysis';
import type { SourceType } from '@/types/analysis';
import type { TranslationLanguage } from '@/types/analysis';
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
// Constante vizuale — valori din tokens.ts
// ----------------------------------------------------------------
const HSK_COLORS: Record<number, string> = {
  1: '#15803d',
  2: '#0369a1',
  3: '#7c3aed',
  4: '#c2410c',
  5: '#b45309',
  6: '#be123c',
};

const DONUT_COLORS = ['#e85d04', '#0369a1'];

// ----------------------------------------------------------------
// Modal creare flashcard din token
// ----------------------------------------------------------------
interface CreateFlashcardFromTokenModalProps {
  hanzi: string;
  pinyin: string | null;
  translation: string | null;
  onClose: () => void;
}

const CreateFlashcardFromTokenModal = ({
  hanzi, pinyin, translation, onClose,
}: CreateFlashcardFromTokenModalProps) => {
  const { sets, loading: loadingSets } = useFlashcardSets();
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [frontText, setFrontText] = useState(hanzi);
  const [backText, setBackText] = useState(
    [pinyin, translation].filter(Boolean).join(' — ')
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (sets.length > 0 && !selectedSetId) {
      setSelectedSetId(sets[0].id);
    }
  }, [sets, selectedSetId]);

  const handleSave = async () => {
    if (!selectedSetId) { setError('Please select a set.'); return; }
    if (!frontText.trim() || !backText.trim()) { setError('Front and back text are required.'); return; }
    setLoading(true);
    setError(null);
    try {
      await createFlashcard({ setId: selectedSetId, frontText: frontText.trim(), backText: backText.trim() });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
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
        <h2 className="font-display text-xl font-bold text-gray-900">
          Add to Flashcards
        </h2>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-2xl">✓</p>
            <p className="text-sm font-semibold text-student">Flashcard created!</p>
          </div>
        ) : (
          <div className="space-y-4">
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
                className="flex-1 h-11 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
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

// ----------------------------------------------------------------
// Componenta afisare rezultat analiza — View pur
// ----------------------------------------------------------------
interface AnalysisResultProps {
  result: TextAnalysisDto;
}

const AnalysisResult = ({ result }: AnalysisResultProps) => {
  const sorted = [...result.tokens].sort((a, b) => a.position_index - b.position_index);
  const fullText = sorted.map((t) => t.hanzi).join('');

  const [tooltipToken, setTooltipToken] = useState<{
    token: typeof sorted[0];
    x: number;
    y: number;
  } | null>(null);
  const [flashcardToken, setFlashcardToken] = useState<typeof sorted[0] | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { speak, isSpeaking, stop } = useTTS();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltipToken(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenClick = useCallback((token: typeof sorted[0], e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    if (tooltipToken?.token.hanzi === token.hanzi) {
      setTooltipToken(null);
      return;
    }
    setTooltipToken({ token, x: rect.left + rect.width / 2, y: rect.top - 8 });
  }, [tooltipToken]);

  return (
    <>
      {flashcardToken && (
        <CreateFlashcardFromTokenModal
          hanzi={flashcardToken.hanzi}
          pinyin={flashcardToken.pinyin}
          translation={flashcardToken.translation}
          onClose={() => setFlashcardToken(null)}
        />
      )}

      {tooltipToken && (
        <div
          ref={tooltipRef}
          className="fixed z-50"
          style={{ left: `${tooltipToken.x}px`, top: `${tooltipToken.y}px`, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className="bg-white rounded-2xl p-4 space-y-3 min-w-52"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.16)', border: '1px solid #f3f4f6' }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-2xl font-bold font-display"
                style={{
                  color: tooltipToken.token.hsk_level
                    ? HSK_COLORS[tooltipToken.token.hsk_level] ?? '#374151'
                    : '#374151',
                }}
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
            {tooltipToken.token.pinyin && (
              <p className="text-sm font-medium text-brand">{tooltipToken.token.pinyin}</p>
            )}
            {tooltipToken.token.translation && (
              <p className="text-sm text-gray-600">{tooltipToken.token.translation}</p>
            )}
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
            <button
              onClick={() => { setFlashcardToken(tooltipToken.token); setTooltipToken(null); }}
              className="w-full h-9 rounded-xl text-xs font-semibold text-white bg-brand transition-all hover:opacity-90"
            >
              + Add to Flashcards
            </button>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"
              style={{ bottom: '-6px', border: '1px solid #f3f4f6', borderTop: 'none', borderLeft: 'none' }}
            />
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{
              background: result.source_type === 'OCR' ? '#f0f9ff' : '#f0fdf4',
              color: result.source_type === 'OCR' ? '#0369a1' : '#15803d',
            }}
          >
            {result.source_type}
          </span>
          {result.overall_hsk_level && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-orange-50 text-brand">
              Overall HSK {result.overall_hsk_level}
            </span>
          )}
          <span className="text-xs text-gray-400">{sorted.length} tokens</span>
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

        <div className="p-5 rounded-2xl leading-loose" style={{ background: '#f9fafb', lineHeight: '2.8' }}>
          {sorted.map((token, i) => (
            <ruby
              key={i}
              onClick={(e) => handleTokenClick(token, e)}
              className="mx-0.5 text-xl font-medium cursor-pointer rounded px-0.5 transition-all hover:bg-orange-50"
              style={{ color: token.hsk_level ? HSK_COLORS[token.hsk_level] ?? '#374151' : '#374151' }}
            >
              {token.hanzi}
              <rt className="text-xs font-normal" style={{ color: '#9ca3af' }}>{token.pinyin ?? ''}</rt>
            </ruby>
          ))}
        </div>

        {result.translated_text && (
          <div className="p-4 rounded-xl text-sm text-gray-600" style={{ background: '#f0f9ff', borderLeft: '3px solid #0369a1' }}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Translation</span>
            {result.translated_text}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {Object.entries(HSK_COLORS).map(([level, color]) => (
            <span key={level} className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: `${color}18`, color }}>
              HSK {level}
            </span>
          ))}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-hsk-unknown">
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
const AnalyzeTab = ({ studentId }: { studentId: number }) => {
  const { analyze, analyzeImage, result, loading } = useAnalysis(studentId);

  const [mode, setMode] = useState<'text' | 'ocr'>('text');
  const [textInput, setTextInput] = useState('');
  const [translationLanguage, setTranslationLanguage] = useState<TranslationLanguage>('ro');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyzeText = async () => {
    if (!textInput.trim()) return;
    await analyze(textInput.trim(), translationLanguage);
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    await analyzeImage(imageFile, translationLanguage);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) setImageFile(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f3f4f6' }}>
        {(['text', 'ocr'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: mode === m ? '#ffffff' : 'transparent',
              color: mode === m ? '#e85d04' : '#6b7280',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {m === 'text' ? 'Text' : 'Image OCR'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Translation language
          </label>
          <select
            value={translationLanguage}
            onChange={(e) => setTranslationLanguage(e.target.value as TranslationLanguage)}
            className="h-8 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 outline-none"
          >
            <option value="ro">Romana</option>
            <option value="en">English</option>
          </select>
        </div>

        {mode === 'text' ? (
          <>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Introdu text chinezesc..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none resize-none"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />
            <button
              onClick={handleAnalyzeText}
              disabled={loading || !textInput.trim()}
              className="h-11 px-6 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragOver ? '#e85d04' : '#e5e7eb',
                background: dragOver ? '#fff7f0' : '#f9fafb',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile ? (
                <p className="text-sm font-semibold text-gray-700">{imageFile.name}</p>
              ) : (
                <p className="text-sm text-gray-400">Drop an image here or click to upload</p>
              )}
            </div>
            <button
              onClick={handleAnalyzeImage}
              disabled={loading || !imageFile}
              className="h-11 px-6 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <AnalysisResult result={result} />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Tab: History
// ----------------------------------------------------------------
const HistoryTab = ({ studentId }: { studentId: number }) => {
  const { fetchHistory, history, historyLoading, fetchById, remove } = useAnalysis(studentId);

  // page este base-0 intern — consistent cu GetAnalysesParams
  const [page, setPage] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<SourceType | ''>('');
  const [hskFilter, setHskFilter] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedData, setExpandedData] = useState<Record<number, TextAnalysisDto>>({});
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  useEffect(() => {
    const params: GetAnalysesParams = {
      page,
      size: 10,
      sortOrder,
      ...(sourceFilter ? { sourceType: sourceFilter } : {}),
      ...(hskFilter    ? { hskLevel: parseInt(hskFilter) } : {}),
    };
    fetchHistory(params);
  }, [page, sourceFilter, hskFilter, sortOrder, fetchHistory]);

  const items      = history?.items      ?? [];
  const total      = history?.total      ?? 0;
  const totalPages = history?.totalPages ?? 1;

  // Resetare la prima pagina la orice schimbare de filtru
  const handleFilterChange = useCallback((fn: () => void) => {
    fn();
    setPage(0);
  }, []);

  const handleExpand = async (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (expandedData[id]) return;
    const data = await fetchById(id);
    if (data) setExpandedData((prev) => ({ ...prev, [id]: data }));
  };

  const handleDelete = async (id: number) => {
    await remove(id);
    setDeleteTarget(null);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={sourceFilter}
          onChange={(e) => handleFilterChange(() => setSourceFilter(e.target.value as SourceType | ''))}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="">All sources</option>
          <option value="MANUAL">Manual</option>
          <option value="OCR">OCR</option>
        </select>
        <select
          value={hskFilter}
          onChange={(e) => handleFilterChange(() => setHskFilter(e.target.value))}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="">All HSK levels</option>
          {[1, 2, 3, 4, 5, 6].map((l) => (
            <option key={l} value={l}>HSK {l}</option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => handleFilterChange(() => setSortOrder(e.target.value as 'newest' | 'oldest'))}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{total} analyses</span>
      </div>

      {historyLoading ? (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-card">
          <p className="text-gray-400 text-sm">No analyses yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-card">
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
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-brand">
                        HSK {item.overall_hsk_level}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(item.created_at).toLocaleDateString('ro-RO')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {deleteTarget === item.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-error text-white"
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
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors text-error"
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

              {expandedId === item.id && (
                <div className="px-5 pb-5" style={{ borderTop: '1px solid #f3f4f6' }}>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            Prev
          </button>
          {/* Afisare base-1 pentru utilizator — intern page este base-0 */}
          <span className="text-sm text-gray-400">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------
// Tab: Stats
// ----------------------------------------------------------------
const StatsTab = ({ studentId }: { studentId: number }) => {
  const { fetchStats, stats, statsLoading, error } = useAnalysis(studentId);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (statsLoading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-gray-400 text-sm">Loading stats...</p>
    </div>
  );

  if (error || !stats) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-error">{error ?? 'No stats available.'}</p>
    </div>
  );

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 space-y-4 shadow-card">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">Tokens by HSK Level</h3>
            <p className="text-xs text-gray-400 mt-0.5">How many tokens you've encountered per level</p>
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

        <div className="bg-white rounded-2xl p-6 space-y-4 shadow-card">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">Analysis Sources</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manual input vs OCR image analyses</p>
          </div>
          {donutData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
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

      {stats.unique_chars_per_hsk_level.length > 0 && (
        <div className="bg-white rounded-2xl p-6 space-y-5 shadow-card">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900">HSK Vocabulary Coverage</h3>
            <p className="text-xs text-gray-400 mt-0.5">Unique characters encountered from each HSK level's word list</p>
          </div>
          <div className="space-y-4">
            {stats.unique_chars_per_hsk_level
              .sort((a, b) => a.hsk_level - b.hsk_level)
              .map((item) => {
                const color = HSK_COLORS[item.hsk_level] ?? '#9ca3af';
                return (
                  <div key={item.hsk_level} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: `${color}18`, color }}>
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
// Pagina principala — View pur
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
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Text Analysis
        </h1>
        <p className="text-gray-400 text-sm">
          Analyze Chinese text or images — get pinyin, HSK levels and translations
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: '#f3f4f6' }}>
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

      <div>
        {activeTab === 'analyze' && <AnalyzeTab studentId={userId} />}
        {activeTab === 'history' && <HistoryTab studentId={userId} />}
        {activeTab === 'stats'   && <StatsTab studentId={userId} />}
      </div>
    </div>
  );
};

export default AnalysisPage;