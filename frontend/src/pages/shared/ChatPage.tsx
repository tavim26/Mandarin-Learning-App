import { useEffect, useState } from 'react';
import { MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { EmptyState } from '@/components/common/EmptyState';
import { SessionList } from '@/components/chat/SessionList';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatSession } from '@/hooks/useChatSession';

// Modal creare sesiune — inline, nu justifica fisier separat
interface CreateSessionModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (title: string, instructions: string) => Promise<void>;
}

const CreateSessionModal = ({
  open,
  onClose,
  onCreate,
}: CreateSessionModalProps) => {
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    await onCreate(title.trim(), instructions.trim());
    setIsCreating(false);
    setTitle('');
    setInstructions('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-display">
            New Conversation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sessionTitle">Title (optional)</Label>
            <Input
              id="sessionTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HSK 1 Practice"
              className="input-branded"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instructions">
              Custom Instructions (optional)
            </Label>
            <Input
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Use only HSK 2 vocabulary."
              className="input-branded"
            />
            <p className="text-xs text-muted-foreground">
              Instructions modify AI behavior for this session only.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="btn-brand"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Start Conversation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// ChatPage
// ============================================================
const ChatPage = () => {
  const {
    sessions,
    activeSession,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isSending,
    isSessionClosed,
    error,
    messagesEndRef,
    fetchSessions,
    openSession,
    createSession,
    sendMessage,
    endSession,
    deleteSession,
  } = useChatSession();

  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (title: string, instructions: string) => {
    await createSession({
      title: title || undefined,
      customInstructions: instructions || undefined,
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden -mx-4 md:-mx-6 -my-6">
      {/* Sidebar sesiuni */}
      <div className="w-72 shrink-0 hidden md:block">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSession?.id ?? null}
          isLoading={isLoadingSessions}
          onSelectSession={openSession}
          onCreateSession={() => setCreateOpen(true)}
          onDeleteSession={deleteSession}
        />
      </div>

      {/* Zona chat */}
      <div className="flex flex-1 flex-col overflow-hidden border-l border-border">
        {!activeSession ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <EmptyState
              icon={MessageSquare}
              title="No conversation selected"
              description="Select an existing conversation or start a new one."
              actionLabel="New Conversation"
              onAction={() => setCreateOpen(true)}
            />
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground truncate text-sm">
                  {activeSession.title}
                </span>
                {isSessionClosed && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Closed
                  </span>
                )}
              </div>

              {!isSessionClosed && (
                <button
                  onClick={endSession}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  End Session
                </button>
              )}
            </div>

            {/* Mesaje */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center space-y-2">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Send a message to start the conversation.
                  </p>
                  {activeSession.customInstructions && (
                    <p className="text-xs text-muted-foreground/70 max-w-xs">
                      Custom instructions active:{' '}
                      <span className="italic">
                        {activeSession.customInstructions}
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))
              )}

              {/* Indicator loading AI */}
              {isSending && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <LoadingSpinner size="sm" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    AI is thinking...
                  </span>
                </div>
              )}

              {error && <ErrorBanner message={error} />}

              {/* Anchor pentru scroll automat */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSend={sendMessage}
              isSending={isSending}
              isDisabled={isSessionClosed}
            />
          </>
        )}
      </div>

      <CreateSessionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default ChatPage;