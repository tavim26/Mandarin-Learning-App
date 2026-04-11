import { useState, useCallback, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface Props {
  onSend: (content: string) => Promise<boolean>;
  isSending: boolean;
  isDisabled: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  isSending,
  isDisabled,
  placeholder = 'Type a message...',
}: Props) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSending || isDisabled) return;

    setValue('');
    // Reset height textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSend(trimmed);
  }, [value, isSending, isDisabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter fara Shift trimite mesajul
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const canSend = value.trim().length > 0 && !isSending && !isDisabled;

  return (
    <div className="border-t border-border bg-card px-4 py-3">
      <div
        className={`
          flex items-end gap-2 rounded-xl border-2 bg-background px-3 py-2
          transition-colors duration-200
          ${isDisabled
            ? 'border-border opacity-60'
            : 'border-border focus-within:border-primary'
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDisabled || isSending}
          placeholder={isDisabled ? 'This session is closed.' : placeholder}
          rows={1}
          className="
            flex-1 resize-none bg-transparent text-sm text-foreground
            placeholder:text-muted-foreground focus:outline-none
            disabled:cursor-not-allowed
            min-h-[24px] max-h-[160px]
          "
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex h-8 w-8 shrink-0 items-center justify-center rounded-lg
            transition-all duration-150
            ${canSend
              ? 'bg-primary text-white hover:bg-[hsl(var(--brand-hover))]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {isSending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};