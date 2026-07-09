import { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Loader2, Brain } from 'lucide-react';
import { useChinesePreview } from '@/hooks/useChinesePreview';
import { useTTS } from '@/hooks/useTTS';
import { CreateFlashcardFromTokenModal } from '@/components/modals/CreateFlashcardFromTokenModal';
import { createPortal } from 'react-dom';

export interface RichTokenDto {
  hanzi: string;
  pinyin: string;
  hsk_level: number | null;
  position_index: number;
  pos: string | null;
  translation?: string; 
}

// Culori HSK
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



// TokenTooltip
interface TokenTooltipProps {
  token: RichTokenDto;
  onClose: () => void;
  onCreateFlashcard: (token: RichTokenDto) => void;
  showFlashcardButton: boolean;
}

const TokenTooltip = ({
  token,
  anchorRef,
  onClose,
  onCreateFlashcard,
  showFlashcardButton,
}: TokenTooltipProps & { anchorRef: React.RefObject<HTMLElement | null> }) => {
  const { speak, isSpeaking } = useTTS();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPosition({
      top: rect.top + window.scrollY - 8,
      left: rect.left + rect.width / 2 + window.scrollX,
    });
  }, [anchorRef]);

  const colorClass = token.hsk_level
    ? (hskTextClass[token.hsk_level] ?? 'text-hsk-unknown')
    : 'text-hsk-unknown';

  return createPortal(
    <>
      {/* Overlay inchidere */}
      <div
        className="fixed inset-0 z-[900]"
        onClick={onClose}
      />

      {/* Tooltip */}
      <div
        className="absolute z-[901] animate-scale-in w-48 rounded-xl border border-border bg-card shadow-form p-3 space-y-2"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, -100%)',
        }}
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

        {/* Traducere */}
        {token.translation && (
          <span className="block text-sm text-foreground">
            {token.translation}
          </span>
        )}

        {/* POS + HSK */}
        <span className="flex items-center justify-between pt-1 border-t border-border">
          {token.pos && (
            <span className="text-[10px] text-muted-foreground capitalize">
              {token.pos}
            </span>
          )}
          {token.hsk_level && (
            <span className={`hsk-badge text-white ${hskBgClass[token.hsk_level]}`}>
              HSK {token.hsk_level}
            </span>
          )}
        </span>

        {/* Buton Create Flashcard */}
        {showFlashcardButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFlashcard(token);
              onClose();
            }}
            className="
              w-full flex items-center justify-center gap-1.5
              rounded-lg border border-primary/30 bg-primary/8
              px-2 py-1.5 text-xs font-medium text-primary
              hover:bg-primary/15 transition-colors
            "
          >
            <Brain className="h-3 w-3" />
            Create Flashcard
          </button>
        )}
      </div>
    </>,
    document.body
  );
};



// InteractiveToken
interface InteractiveTokenProps {
  token: RichTokenDto;
  showPinyin: boolean;
  showFlashcardButton: boolean;
  onCreateFlashcard: (token: RichTokenDto) => void;
}

const InteractiveToken = ({
  token,
  showPinyin,
  showFlashcardButton,
  onCreateFlashcard,
}: InteractiveTokenProps) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (token.pos === 'punctuatie') {
    return (
      <span className="inline-flex flex-col items-center">
        <span className="font-display text-xl text-muted-foreground">
          {token.hanzi}
        </span>
        {showPinyin && <span className="h-3.5" />}
      </span>
    );
  }

  const colorClass = token.hsk_level
    ? (hskTextClass[token.hsk_level] ?? 'text-hsk-unknown')
    : 'text-foreground';

  return (
    <span className="relative inline-flex flex-col items-center">
      <button
        ref={buttonRef}
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

      {showPinyin && (
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5 font-medium">
          {token.pinyin}
        </span>
      )}

      {open && (
        <TokenTooltip
          token={token}
          anchorRef={buttonRef}
          onClose={() => setOpen(false)}
          onCreateFlashcard={onCreateFlashcard}
          showFlashcardButton={showFlashcardButton}
        />
      )}
    </span>
  );
};



// ChineseText — componenta principala
interface Props {
  text: string;
  className?: string;
  showPinyin?: boolean;
  showPlayAll?: boolean;
  showFlashcardButton?: boolean;
  preloadedTokens?: RichTokenDto[];
}

export const ChineseText = ({
  text,
  className = '',
  showPinyin = false,
  showPlayAll = false,
  showFlashcardButton = false,
  preloadedTokens,
}: Props) => {
  const { tokens: fetchedTokens, isLoading, fetchPreview } =
    useChinesePreview();
  const { speak, stop, isSpeaking } = useTTS();
  const [flashcardToken, setFlashcardToken] = useState<RichTokenDto | null>(
    null
  );

  useEffect(() => {
    if (!preloadedTokens && text.trim()) fetchPreview(text);
  }, [text, fetchPreview, preloadedTokens]);

  const handlePlayAll = useCallback(() => {
    if (isSpeaking) stop();
    else speak(text);
  }, [text, speak, stop, isSpeaking]);

  const hasChinese = /[\u4e00-\u9fff]/.test(text);

  if (!hasChinese) {
    return (
      <span className={`font-display text-xl text-foreground ${className}`}>
        {text}
      </span>
    );
  }

  if (!preloadedTokens && (isLoading || !fetchedTokens)) {
    return (
      <span className={`font-display text-xl text-foreground ${className}`}>
        {text}
      </span>
    );
  }

  const activeTokens: RichTokenDto[] = preloadedTokens ?? fetchedTokens ?? [];

  return (
    <>
      <span className={`inline-flex flex-col gap-1 ${className}`}>
        <span className="flex flex-wrap items-end gap-x-1 gap-y-2">
          {activeTokens.map((token, idx) => (
            <InteractiveToken
              key={idx}
              token={token}
              showPinyin={showPinyin}
              showFlashcardButton={showFlashcardButton}
              onCreateFlashcard={setFlashcardToken}
            />
          ))}

          {showPlayAll && (
            <button
              onClick={handlePlayAll}
              title={isSpeaking ? 'Stop' : 'Play all'}
              className={`
                flex h-8 w-8 shrink-0 items-center justify-center
                rounded-full border transition-colors duration-150 mb-0.5
                ${isSpeaking
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted text-muted-foreground hover:border-primary/40 hover:bg-primary/8 hover:text-primary'
                }
              `}
            >
              {isSpeaking
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Volume2 className="h-3.5 w-3.5" />
              }
            </button>
          )}
        </span>
      </span>

      {flashcardToken && (
        <CreateFlashcardFromTokenModal
          open={!!flashcardToken}
          hanzi={flashcardToken.hanzi}
          pinyin={flashcardToken.pinyin}
          translation={flashcardToken.translation}
          onClose={() => setFlashcardToken(null)}
        />
      )}
    </>
  );
};