import { useState, useCallback } from 'react';
import { useTTS } from '@/hooks/useTTS';
import { Volume2 } from 'lucide-react';
import type { AnalysisTokenDto } from '@/hooks/useAnalysis';

interface Props {
  token: AnalysisTokenDto;
  showHskBadge?: boolean;
}

const hskTextClass: Record<number, string> = {
  1: 'text-hsk-1',
  2: 'text-hsk-2',
  3: 'text-hsk-3',
  4: 'text-hsk-4',
  5: 'text-hsk-5',
  6: 'text-hsk-6',
};

export const TokenDisplay = ({ token, showHskBadge = true }: Props) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const { speak, isSpeaking } = useTTS();

  const handleClick = useCallback(() => {
    setIsTooltipOpen((prev) => !prev);
  }, []);

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      speak(token.hanzi);
    },
    [speak, token.hanzi]
  );

  // Punctuatia nu este interactiva
  if (token.pos === 'punctuatie') {
    return (
      <span className="text-muted-foreground font-display text-xl">
        {token.hanzi}
      </span>
    );
  }

  const colorClass = token.hsk_level
    ? (hskTextClass[token.hsk_level] ?? 'text-hsk-unknown')
    : 'text-hsk-unknown';

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        className={`
          font-display text-xl font-medium leading-relaxed
          border-b-2 border-dotted transition-colors duration-150
          hover:opacity-80 ${colorClass}
          border-current
        `}
      >
        {token.hanzi}
      </button>

      {/* Tooltip */}
      {isTooltipOpen && (
        <>
          {/* Overlay pentru inchidere */}
          <span
            className="fixed inset-0 z-10"
            onClick={() => setIsTooltipOpen(false)}
          />
          <span
            className="
              absolute bottom-full left-1/2 z-20 mb-2
              -translate-x-1/2 animate-scale-in
              w-48 rounded-xl border border-border
              bg-card shadow-form p-3 space-y-2
            "
          >
            {/* Hanzi mare */}
            <span className="flex items-center justify-between">
              <span className={`font-display text-2xl font-bold ${colorClass}`}>
                {token.hanzi}
              </span>
              <button
                onClick={handleSpeak}
                className={`
                  flex h-7 w-7 items-center justify-center rounded-lg
                  transition-colors
                  ${isSpeaking
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }
                `}
                aria-label="Pronounce"
              >
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            </span>

            {/* Pinyin */}
            <span className="block text-sm font-medium text-muted-foreground">
              {token.pinyin}
            </span>

            {/* Traducere */}
            <span className="block text-sm text-foreground">
              {token.translation}
            </span>

            {/* Footer: POS + HSK badge */}
            <span className="flex items-center justify-between pt-1 border-t border-border">
              {token.pos && (
                <span className="text-[10px] text-muted-foreground capitalize">
                  {token.pos}
                </span>
              )}
              {showHskBadge && token.hsk_level && (
                <span
                  className={`hsk-badge ${
                    `bg-hsk-${token.hsk_level}`
                  }`}
                >
                  HSK {token.hsk_level}
                </span>
              )}
            </span>
          </span>
        </>
      )}
    </span>
  );
};