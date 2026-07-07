import { useEffect, useState, useCallback } from 'react';
import { BarChart2, Upload, Type, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { HskStatsChart } from '@/components/analysis/HskStatsChart';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
{/* Importul existent de TokenDisplay nu mai este necesar */}
import { ChineseText } from '@/components/common/ChineseText';
import { useAnalysis } from '@/hooks/useAnalysis';
import type {
  TextAnalysisSummaryDto,
  TranslationLanguage,
} from '@/hooks/useAnalysis';

const LANGUAGES: { value: TranslationLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ro', label: 'Romanian' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const AnalysisPage = () => {
  const {
    analysisList,
    currentAnalysis,
    stats,
    isLoading,
    isAnalyzing,
    error,
    fetchList,
    fetchStats,
    fetchAnalysisById,
    analyzeText,
    analyzeOcr,
    deleteAnalysis,
  } = useAnalysis();

  const [activeTab, setActiveTab] = useState<'text' | 'ocr' | 'history' | 'stats'>('text');
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<TranslationLanguage>('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<TextAnalysisSummaryDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') fetchList();
    if (activeTab === 'stats') fetchStats();
  }, [activeTab, fetchList, fetchStats]);

  const handleAnalyzeText = async () => {
    if (!inputText.trim()) return;
    await analyzeText(inputText.trim(), language);
    setInputText('');
  };

  const handleAnalyzeOcr = async () => {
    if (!selectedFile) return;
    await analyzeOcr(selectedFile, language);
    setSelectedFile(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const success = await deleteAnalysis(deleteTarget.id);
    setIsDeleting(false);
    if (success) setDeleteTarget(null);
  };

  const handleSelectAnalysis = useCallback(
  (id: number) => {
    if (id === -1) {
      // Deselect
      fetchAnalysisById(0);
      return;
    }
    fetchAnalysisById(id);
  },
  [fetchAnalysisById]
);

  const tabs = [
    { key: 'text', label: 'Analyze Text', icon: Type },
    { key: 'ocr', label: 'OCR', icon: Upload },
    { key: 'history', label: 'History', icon: ChevronDown },
    { key: 'stats', label: 'Statistics', icon: BarChart2 },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Text Analysis"
        subtitle="Analyze Chinese text to see pinyin, HSK levels and translations."
        icon={BarChart2}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              border-b-2 transition-colors duration-150
              ${activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Tab: Analyze Text */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Enter Chinese text
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as TranslationLanguage)
                }
                className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste or type Chinese text here..."
              rows={4}
              className="
                w-full rounded-lg border border-border bg-background
                px-3 py-2 text-sm text-foreground resize-none
                focus:border-primary focus:outline-none
                placeholder:text-muted-foreground
              "
            />

            <Button
              onClick={handleAnalyzeText}
              disabled={isAnalyzing || !inputText.trim()}
              className="btn-brand w-full"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Analyzing...
                </span>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>

          {/* Rezultat analiza */}
          {currentAnalysis && (
            <div className="card-base p-5 space-y-4 animate-slide-up">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Translation ({currentAnalysis.translation_language.toUpperCase()})
                  </p>
                  <p className="text-sm text-foreground">
                    {currentAnalysis.translated_text}
                  </p>
                </div>
                {currentAnalysis.overall_hsk_level && (
                  <span
                    className={`hsk-badge bg-hsk-${currentAnalysis.overall_hsk_level} shrink-0`}
                  >
                    HSK {currentAnalysis.overall_hsk_level}
                  </span>
                )}
              </div>

              <div className="divider" />

              {/* Tokeni */}
<ChineseText
  text={currentAnalysis.raw_text}
  showPinyin={true}
  showPlayAll={true}
  showFlashcardButton={true}
  preloadedTokens={currentAnalysis.tokens
    .sort((a, b) => a.position_index - b.position_index)
    .map((t) => ({
      hanzi: t.hanzi,
      pinyin: t.pinyin,
      hsk_level: t.hsk_level,
      position_index: t.position_index,
      pos: t.pos,
      translation: t.translation,
    }))}
/>
            </div>
          )}
        </div>
      )}

      {/* Tab: OCR */}
      {activeTab === 'ocr' && (
        <div className="space-y-4">
          <div className="card-base p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Upload an image with Chinese text
              </label>
              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as TranslationLanguage)
                }
                className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <label
              className={`
                flex cursor-pointer flex-col items-center gap-3
                rounded-lg border-2 border-dashed px-4 py-8
                transition-colors duration-150
                ${selectedFile
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border bg-muted/30 hover:border-primary/30'
                }
              `}
            >
              <Upload
                className={`h-8 w-8 ${
                  selectedFile ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm text-muted-foreground text-center">
                {selectedFile
                  ? selectedFile.name
                  : 'Click to select an image (JPEG, PNG)'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setSelectedFile(e.target.files?.[0] ?? null)
                }
              />
            </label>

            <Button
              onClick={handleAnalyzeOcr}
              disabled={isAnalyzing || !selectedFile}
              className="btn-brand w-full"
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Analyzing...
                </span>
              ) : (
                'Extract and Analyze'
              )}
            </Button>
          </div>

          {/* Rezultat OCR */}
          {currentAnalysis && currentAnalysis.source_type === 'OCR' && (
  <div className="card-base p-5 space-y-4 animate-slide-up">
    {/* Traducere */}
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Translation ({currentAnalysis.translation_language.toUpperCase()})
        </p>
        <p className="text-sm text-foreground">
          {currentAnalysis.translated_text}
        </p>
      </div>
      {currentAnalysis.overall_hsk_level && (
        <span
          className={`hsk-badge bg-hsk-${currentAnalysis.overall_hsk_level} shrink-0 text-white`}
        >
          HSK {currentAnalysis.overall_hsk_level}
        </span>
      )}
    </div>

    <div className="divider" />

    <p className="text-xs text-muted-foreground">
      Extracted text:{' '}
      <span className="font-medium text-foreground">
        {currentAnalysis.raw_text}
      </span>
    </p>

    <div className="divider" />

    <ChineseText
      text={currentAnalysis.raw_text}
      showPinyin={true}
      showPlayAll={true}
      showFlashcardButton={true}
      preloadedTokens={currentAnalysis.tokens
        .sort((a, b) => a.position_index - b.position_index)
        .map((t) => ({
          hanzi: t.hanzi,
          pinyin: t.pinyin,
          hsk_level: t.hsk_level,
          position_index: t.position_index,
          pos: t.pos,
          translation: t.translation,
        }))}
    />
  </div>
)}


</div>
)}



      

      {/* Tab: History */}
      {activeTab === 'history' && 
     (
  <div className="space-y-3">
    {isLoading ? (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    ) : !analysisList || analysisList.items.length === 0 ? (
      <EmptyState
        icon={BarChart2}
        title="No analyses yet"
        description="Analyze some text to see your history here."
      />
    ) : (
      analysisList.items.map((item) => {
        const isSelected =
          currentAnalysis?.id === item.id;

        return (
          <div key={item.id} className="space-y-0">
            {/* Header item */}
            <div
              className={`
                card-base p-4 flex items-start justify-between gap-3
                transition-colors duration-150
                ${isSelected ? 'border-primary/40 bg-primary/4 rounded-b-none border-b-0' : ''}
              `}
            >
              <button
                onClick={() =>
                  isSelected
                    ? handleSelectAnalysis(-1) // deselect
                    : handleSelectAnalysis(item.id)
                }
                className="flex-1 text-left space-y-1"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate max-w-xs">
                    {item.raw_text}
                  </p>
                  {isSelected && (
                    <span className="shrink-0 text-xs text-primary font-medium">
                      ▲ Hide
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{item.source_type}</span>
                  <span>·</span>
                  <span>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {item.overall_hsk_level && (
                    <>
                      <span>·</span>
                      <span
                        className={`hsk-badge text-white bg-hsk-${item.overall_hsk_level}`}
                      >
                        HSK {item.overall_hsk_level}
                      </span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Detalii inline*/}
            {isSelected && currentAnalysis && (
              <div className="border border-primary/40 border-t-0 rounded-b-lg bg-card p-5 space-y-4 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Translation ({currentAnalysis.translation_language.toUpperCase()})
                    </p>
                    <p className="text-sm text-foreground">
                      {currentAnalysis.translated_text}
                    </p>
                  </div>
                  {currentAnalysis.overall_hsk_level && (
                    <span
                      className={`hsk-badge text-white bg-hsk-${currentAnalysis.overall_hsk_level} shrink-0`}
                    >
                      HSK {currentAnalysis.overall_hsk_level}
                    </span>
                  )}
                </div>
                <div className="divider" />
                <ChineseText
                  text={currentAnalysis.raw_text}
                  showPinyin={true}
                  showPlayAll={true}
                  showFlashcardButton={true}
                  preloadedTokens={currentAnalysis.tokens
                    .sort((a, b) => a.position_index - b.position_index)
                    .map((t) => ({
                      hanzi: t.hanzi,
                      pinyin: t.pinyin,
                      hsk_level: t.hsk_level,
                      position_index: t.position_index,
                      pos: t.pos,
                      translation: t.translation,
                    }))}
                />
              </div>
            )}
          </div>
        );
      })
    )}
  </div>
)}



      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : !stats ? (
            <EmptyState
              icon={BarChart2}
              title="No statistics yet"
              description="Analyze some text to see your vocabulary statistics."
            />
          ) : (
            <HskStatsChart stats={stats} />
          )}
        </div>
      )}

      <DeleteConfirmModal
        open={!!deleteTarget}
        title="Delete Analysis"
        description="This analysis and all its tokens will be permanently deleted."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AnalysisPage;