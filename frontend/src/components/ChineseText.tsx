import { useState, useRef, useEffect, useCallback } from 'react';
import { analysisApi } from '@/api/analysisApi';
import type { PreviewTokenDto } from '@/types/analysis';
import SpeakButton from '@/components/SpeakButton';

interface TooltipData {
  tokens: PreviewTokenDto[];
  word: string;
}

interface TooltipState {
  data: TooltipData | null;
  loading: boolean;
  x: number;
  y: number;
  visible: boolean;
}

// Cache in-memory — evita apeluri repetate pentru acelasi text in aceeasi sesiune
const previewCache = new Map<string, TooltipData>();

// Regex pentru detectarea caracterelor chinezesti
const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]+/g;

const splitText = (text: string): { value: string; isChinese: boolean }[] => {
  const segments: { value: string; isChinese: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  CHINESE_REGEX.lastIndex = 0;
  while ((match = CHINESE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ value: text.slice(lastIndex, match.index), isChinese: false });
    }
    segments.push({ value: match[0], isChinese: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ value: text.slice(lastIndex), isChinese: false });
  }
  return segments;
};

interface ChineseTextProps {
  text: string;
  className?: string;
}

const ChineseText = ({ text, className = '' }: ChineseTextProps) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    data: null, loading: false, x: 0, y: 0, visible: false,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const segments = splitText(text);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChineseClick = useCallback(async (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 8;

    if (previewCache.has(word)) {
      setTooltip({ data: previewCache.get(word)!, loading: false, x, y, visible: true });
      return;
    }

    setTooltip({ data: null, loading: true, x, y, visible: true });

    try {
      const result = await analysisApi.previewText(word);
      const data: TooltipData = { tokens: result.tokens, word };
      previewCache.set(word, data);
      setTooltip({ data, loading: false, x, y, visible: true });
    } catch {
      setTooltip((prev) => ({ ...prev, loading: false, visible: false }));
    }
  }, []);

  return (
    <>
      <span className={className}>
        {segments.map((seg, i) =>
          seg.isChinese ? (
            <span
              key={i}
              onClick={(e) => handleChineseClick(seg.value, e)}
              className="cursor-pointer rounded px-0.5 transition-all hover:bg-orange-50"
              title="Click for pinyin"
            >
              {seg.value}
            </span>
          ) : (
            <span key={i}>{seg.value}</span>
          )
        )}
      </span>

      {tooltip.visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div
            className="bg-white rounded-2xl p-4 space-y-2 min-w-40"
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              border: '1px solid #f3f4f6',
            }}
          >
            {tooltip.loading ? (
              <p className="text-xs text-gray-400 text-center py-1">Loading...</p>
            ) : tooltip.data ? (
              <>
                {/* Header — caracterul mare + buton TTS */}
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: '#e85d04', fontFamily: 'Outfit, sans-serif' }}
                  >
                    {tooltip.data.word}
                  </span>
                  <SpeakButton text={tooltip.data.word} size="sm" />
                </div>

                {/* Tokeni — hanzi + pinyin + badge HSK */}
                <div className="space-y-1.5">
                  {tooltip.data.tokens.map((token, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">
                          {token.hanzi}
                        </span>
                        {token.pinyin && (
                          <span
                            className="text-sm font-medium"
                            style={{ color: '#e85d04' }}
                          >
                            {token.pinyin}
                          </span>
                        )}
                      </div>
                      {token.hsk_level && (
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: '#fff7f0', color: '#e85d04' }}
                        >
                          HSK {token.hsk_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {/* Triunghi decorativ */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"
              style={{
                bottom: '-6px',
                border: '1px solid #f3f4f6',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChineseText;