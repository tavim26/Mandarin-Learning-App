import { useMemo } from 'react';
import { Bot, User } from 'lucide-react';
import type { ChatMessageDto } from '@/hooks/useChatSession';

interface Props {
  message: ChatMessageDto;
}

const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const MessageBubble = ({ message }: Props) => {
  const isAI = message.sender === 'AI';
  const time = useMemo(() => formatTime(message.createdAt), [message.createdAt]);

  return (
    <div
      className={`flex items-end gap-2.5 ${isAI ? 'justify-start' : 'justify-end'} animate-slide-up`}
    >
      {/* Avatar AI */}
      {isAI && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mb-1">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div
        className={`flex flex-col gap-1 max-w-[75%] ${isAI ? 'items-start' : 'items-end'}`}
      >
        <div
          className={`
            rounded-2xl px-4 py-2.5 text-sm leading-relaxed
            ${isAI
              ? 'rounded-tl-sm bg-card border border-border text-foreground'
              : 'rounded-tr-sm bg-primary text-white'
            }
          `}
        >
          {/* Pastreaza newline-urile din raspunsul AI */}
          {message.content.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < message.content.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">{time}</span>
      </div>

      {/* Avatar Student */}
      {!isAI && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mb-1">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};