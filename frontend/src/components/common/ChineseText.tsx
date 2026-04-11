import { useState, useEffect } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { useChinesePreview } from '@/hooks/useChinesePreview';
import { useTTS } from '@/hooks/useTTS';
import type { PreviewTokenDto } from '@/hooks/useChinesePreview';

// ============================================================
// Tooltip per token
// ============================================================
interface TokenTooltipProps {
  token: PreviewTokenDto;
  onClose: () => void;
}

const hskTextClass: Record<number, string> = {
  1: 'text-hsk-1',
  2: 'text-hsk-2',
  3: 'text-hsk-3',
  4: 'text-hsk-4',
  5: 'text-hsk-5',
  6: 'text-hsk-6',
};

const hskBgClass: Record<number, string> = {
  1: 'bg-hsk-1',
  2: 'bg-hsk-2',
  3: 'bg-hsk-3',
  4: 'bg-hsk-4',
  5: 'bg-hsk-5',
  6: 'bg-hsk-6',
};

const TokenTooltip = ({ token, onClose }: TokenTooltipProps) => {
  const { speak, isSpeaking } = useTTS();

  const colorClass = token.hsk_level
    ? (hskTextClass[token.hsk_level] ?? 'text-hsk-unknown')
    : 'text-hsk-unknown';

  return (
    <>
      {/* Overlay pentru inchidere */}
      <span
        className="fixed inset-0 z-10"
        onClick={onClose}
      />
      <span
        className="
          absolute bottom-full left-1/2 z-20 mb-2
          -translate-x-1/2 animate-scale-in
          w-44 rounded-xl border border-border
          bg-card shadow-form p-3 space-y-2
          block
        "
      >
        {/* Hanzi + TTS */}
        <span className="flex items-center justify-between">
          <span className={`font-display text-2xl font-bold ${colorClass}`}>
            {token.hanzi}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak(token.hanzi);
            }}
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
            {isSpeaking
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Volume2 className="h-3.5 w-3.5" />
            }
          </button>
        </span>

        {/* Pinyin */}
        <span className="block text-sm font-medium text-muted-foreground">
          {token.pinyin}
        </span>

        {/* POS + HSK */}
        <span className="flex items-center justify-between pt-1 border-t border-border">
          {token.pos && (
            <span className="text-[10px] text-muted-foreground capitalize">
              {token.pos}
            </span>
          )}
          {token.hsk_level && (
            <span
              className={`hsk-badge text-white ${hskBgClass[token.hsk_level]}`}
            >
              HSK {token.hsk_level}
            </span>
          )}
        </span>
      </span>
    </>
  );
};

// ============================================================
// InteractiveToken — un singur token clicabil
// ============================================================
interface InteractiveTokenProps {
  token: PreviewTokenDto;
}

const InteractiveToken = ({ token }: InteractiveTokenProps) => {
  const [open, setOpen] = useState(false);

  // Punctuatia nu e interactiva
  if (token.pos === 'punctuatie') {
    return (
      <span className="font-display text-xl text-muted-foreground">
        {token.hanzi}
      </span>
    );
  }

  const colorClass = token.hsk_level
    ? (hskTextClass[token.hsk_level] ?? 'text-hsk-unknown')
    : 'text-foreground';

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`
          font-display text-xl font-medium leading-relaxed
          border-b-2 border-dotted border-current
          transition-opacity hover:opacity-70
          ${colorClass}
        `}
      >
        {token.hanzi}
      </button>
      {open && (
        <TokenTooltip token={token} onClose={() => setOpen(false)} />
      )}
    </span>
  );
};

// ============================================================
// ChineseText — componenta principala
// ============================================================
interface Props {
  text: string;
  className?: string;
}

export const ChineseText = ({ text, className = '' }: Props) => {
  const { tokens, isLoading, fetchPreview } = useChinesePreview();

  useEffect(() => {
    if (text.trim()) fetchPreview(text);
  }, [text, fetchPreview]);

  // Detecteaza daca textul contine caractere chinezesti
  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  if (!hasChinese) {
    return (
      <span className={`font-display text-xl text-foreground ${className}`}>
        {text}
      </span>
    );
  }

  if (isLoading || !tokens) {
    return (
      <span className={`font-display text-xl text-foreground ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`flex flex-wrap items-end gap-x-0.5 gap-y-1 ${className}`}>
      {tokens.map((token, idx) => (
        <InteractiveToken key={idx} token={token} />
      ))}
    </span>
  );
};