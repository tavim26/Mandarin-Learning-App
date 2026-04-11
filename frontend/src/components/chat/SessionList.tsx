import { useCallback } from 'react';
import { Plus, MessageSquare, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import type { ChatSessionDto } from '@/hooks/useChatSession';

interface Props {
  sessions: ChatSessionDto[];
  activeSessionId: number | null;
  isLoading: boolean;
  onSelectSession: (session: ChatSessionDto) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: number) => void;
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const SessionList = ({
  sessions,
  activeSessionId,
  isLoading,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: Props) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent, sessionId: number) => {
      e.stopPropagation();
      onDeleteSession(sessionId);
    },
    [onDeleteSession]
  );

  return (
    <div className="flex h-full flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-display font-semibold text-sm text-foreground">
          Conversations
        </h2>
        <Button
          size="sm"
          onClick={onCreateSession}
          className="btn-brand h-8 gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {/* Lista sesiuni */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a new conversation to practice Chinese."
          />
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isClosed = session.endedAt !== null;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`
                  group relative flex cursor-pointer flex-col gap-1
                  px-4 py-3 transition-colors duration-150
                  ${isActive
                    ? 'bg-primary/8 border-r-2 border-r-primary'
                    : 'hover:bg-muted'
                  }
                `}
              >
                {/* Titlu + status */}
                <div className="flex items-center gap-2 pr-6">
                  {isClosed && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span
                    className={`truncate text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {session.title}
                  </span>
                </div>

                {/* Preview mesaj */}
                {session.lastMessagePreview && (
                  <p className="truncate text-xs text-muted-foreground pr-6">
                    {session.lastMessagePreview}
                  </p>
                )}

                {/* Data + numar mesaje */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(session.startedAt)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {session.messageCount} msg
                  </span>
                </div>

                {/* Buton stergere — apare la hover */}
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    flex h-6 w-6 items-center justify-center rounded
                    text-muted-foreground opacity-0 transition-all
                    hover:bg-destructive/10 hover:text-destructive
                    group-hover:opacity-100
                  "
                  aria-label="Delete session"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};