import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getSessions, createSession, getMessages, sendMessage, deleteSession } from '@/api/chatbotApi';
import type { ChatSessionDto, ChatMessageDto } from '@/types';

// ----------------------------------------------------------------
// Utilitare
// ----------------------------------------------------------------

const formatTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
};

// ----------------------------------------------------------------
// Icona chat — SVG inline
// ----------------------------------------------------------------
const ChatIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ----------------------------------------------------------------
// Componenta principala
// ----------------------------------------------------------------
const ChatbotWidget = () => {
  const { role } = useAuthStore();
  const [open, setOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Scroll automat la ultimul mesaj
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // Fetch sesiuni la deschidere
  useEffect(() => {
    if (!open) return;
    fetchSessions();
  }, [open]);

  // Focus input la selectarea sesiunii
  useEffect(() => {
    if (activeSession) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeSession]);

    // Chatbot-ul e disponibil doar pentru STUDENT
  if (role !== 'STUDENT') return null;

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const data = await getSessions();
      setSessions(data);
    } catch {
      // Sesiunile nu se incarca — UI ramane gol
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleSelectSession = async (session: ChatSessionDto) => {
    if (activeSession?.id === session.id) return;
    setActiveSession(session);
    setMessages([]);
    setSendError(null);
    setLoadingMessages(true);
    try {
      const msgs = await getMessages(session.id);
      setMessages(msgs);
    } catch {
      // Mesajele nu se incarca
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleNewSession = async () => {
    try {
      const session = await createSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setSendError(null);
    } catch {
      // Nu s-a putut crea sesiunea
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeSession || sending) return;
    if (activeSession.endedAt !== null) return;

    const content = input.trim();
    setInput('');
    setSendError(null);
    setSending(true);

    // Optimistic update — adauga mesajul studentului imediat
    const optimisticMsg: ChatMessageDto = {
      id: -1,
      sessionId: activeSession.id,
      sender: 'STUDENT',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const response = await sendMessage(activeSession.id, { content });

      // Inlocuieste mesajul optimistic cu cel real + adauga raspunsul AI
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== -1),
        response.userMessage,
        response.aiMessage,
      ]);

      // Actualizeaza titlul sesiunii daca a fost generat automat
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? { ...s, title: response.userMessage.content.slice(0, 40), lastMessagePreview: response.aiMessage.content.slice(0, 60) }
            : s
        )
      );
    } catch (err: unknown) {
      // Elimina mesajul optimistic la eroare
      setMessages((prev) => prev.filter((m) => m.id !== -1));
      setInput(content);

      if (err instanceof Error && err.message.includes('503')) {
        setSendError('AI unavailable. Please try again.');
      } else if (err instanceof Error && err.message.includes('409')) {
        setSendError('This session is closed.');
      } else {
        setSendError('Failed to send message. Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    }
  };

  const isClosed = activeSession?.endedAt !== null;

  return (
    <>
      {/* Buton floating */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#e85d04', boxShadow: '0 4px 24px rgba(232,93,4,0.35)' }}
        title="AI Tutor Chat"
      >
        {open ? (
          // Icona X — inchide
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <ChatIcon size={22} />
        )}
      </button>

      {/* Overlay + Sidebar */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.25)' }}
            onClick={() => setOpen(false)}
          />

          {/* Sidebar panel */}
          <div
            className="fixed top-0 right-0 h-full z-50 flex"
            style={{ width: '780px', maxWidth: '95vw' }}
          >

            {/* Coloana stanga — lista sesiuni */}
            <div
              className="flex flex-col h-full"
              style={{
                width: '240px',
                flexShrink: 0,
                background: '#1a0a00',
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Header sesiuni */}
              <div
                className="flex items-center justify-between px-4 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  Conversations
                </p>
                <button
                  onClick={handleNewSession}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                  style={{ background: '#e85d04', color: 'white' }}
                  title="New conversation"
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Lista sesiuni */}
              <div className="flex-1 overflow-y-auto py-2">
                {loadingSessions ? (
                  <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Loading...
                  </p>
                ) : sessions.length === 0 ? (
                  <div className="px-4 py-6 text-center space-y-2">
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No conversations yet.
                    </p>
                    <button
                      onClick={handleNewSession}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: '#e85d04', color: 'white' }}
                    >
                      Start one
                    </button>
                  </div>
                ) : (
                  sessions.map((session) => {
                    const isActive = activeSession?.id === session.id;
                    return (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="group relative px-3 py-3 mx-2 rounded-xl cursor-pointer transition-all mb-1"
                        style={{
                          background: isActive ? 'rgba(232,93,4,0.15)' : 'transparent',
                          border: isActive ? '1px solid rgba(232,93,4,0.3)' : '1px solid transparent',
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: isActive ? '#e85d04' : 'rgba(255,255,255,0.8)' }}
                            >
                              {session.title ?? 'New conversation'}
                            </p>
                            {session.lastMessagePreview && (
                              <p
                                className="text-xs truncate mt-0.5"
                                style={{ color: 'rgba(255,255,255,0.35)' }}
                              >
                                {session.lastMessagePreview}
                              </p>
                            )}
                            <p
                              className="text-xs mt-1"
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              {formatDate(session.startedAt)}
                            </p>
                          </div>

                          {/* Buton stergere — apare la hover */}
                          {deleteTarget === session.id ? (
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: '#c1121f', color: 'white' }}
                              >
                                Yes
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteTarget(null); }}
                                className="text-xs px-1.5 py-0.5 rounded font-semibold"
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(session.id); }}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all hover:bg-red-900"
                              style={{ color: 'rgba(255,255,255,0.4)' }}
                            >
                              <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6M14 11v6" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Badge sesiune inchisa */}
                        {session.endedAt !== null && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}
                          >
                            closed
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coloana dreapta — chat activ */}
            <div
              className="flex flex-col flex-1 h-full"
              style={{ background: '#ffffff' }}
            >
              {!activeSession ? (
                // Stare empty — nicio sesiune selectata
                <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: '#fff7f0' }}
                  >
                    <ChatIcon size={28} />
                  </div>
                  <div className="space-y-1">
                    <p
                      className="text-lg font-bold text-gray-900"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      AI Mandarin Tutor
                    </p>
                    <p className="text-sm text-gray-400">
                      Start a new conversation or select an existing one.
                    </p>
                  </div>
                  <button
                    onClick={handleNewSession}
                    className="h-11 px-6 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    style={{ background: '#e85d04' }}
                  >
                    New Conversation
                  </button>
                </div>
              ) : (
                <>
                  {/* Header chat */}
                  <div
                    className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #f3f4f6' }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-sm font-bold text-gray-900 truncate"
                        style={{ fontFamily: 'Outfit, sans-serif' }}
                      >
                        {activeSession.title ?? 'New conversation'}
                      </p>
                      {isClosed && (
                        <span className="text-xs text-gray-400">Session closed</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Badge mesaje */}
                      <span
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: '#f3f4f6', color: '#6b7280' }}
                      >
                        {messages.length} msgs
                      </span>
                    </div>
                  </div>

                  {/* Zona mesaje */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-400">Loading messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-400">
                          Send a message to start the conversation.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isStudent = msg.sender === 'STUDENT';
                        return (
                          <div
                            key={msg.id === -1 ? `opt-${msg.createdAt}` : msg.id}
                            className={`flex ${isStudent ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className="max-w-xs lg:max-w-sm px-4 py-3 rounded-2xl space-y-1"
                              style={{
                                background: isStudent ? '#e85d04' : '#f9fafb',
                                color: isStudent ? '#ffffff' : '#374151',
                                borderRadius: isStudent
                                  ? '18px 18px 4px 18px'
                                  : '18px 18px 18px 4px',
                              }}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                              <p
                                className="text-xs"
                                style={{
                                  color: isStudent ? 'rgba(255,255,255,0.6)' : '#9ca3af',
                                  textAlign: 'right',
                                }}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Loading indicator AI */}
                    {sending && (
                      <div className="flex justify-start">
                        <div
                          className="px-4 py-3 rounded-2xl"
                          style={{
                            background: '#f9fafb',
                            borderRadius: '18px 18px 18px 4px',
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background: '#e85d04',
                                  animation: 'bounce 1.2s infinite',
                                  animationDelay: `${i * 0.2}s`,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Eroare trimitere */}
                    {sendError && (
                      <div className="flex justify-center">
                        <div
                          className="px-4 py-2 rounded-xl flex items-center gap-3"
                          style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                        >
                          <p className="text-xs text-red-600">{sendError}</p>
                          <button
                            onClick={() => { setSendError(null); handleSend(); }}
                            className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{ background: '#c1121f', color: 'white' }}
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input trimitere mesaj */}
                  <div
                    className="px-4 py-4 flex-shrink-0"
                    style={{ borderTop: '1px solid #f3f4f6' }}
                  >
                    {isClosed ? (
                      <div
                        className="w-full py-3 rounded-xl text-center text-sm text-gray-400"
                        style={{ background: '#f9fafb' }}
                      >
                        This session is closed. Start a new conversation.
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                          placeholder="Ask about Mandarin..."
                          disabled={sending}
                          className="flex-1 h-11 px-4 rounded-xl border text-sm outline-none transition-all"
                          style={{
                            borderColor: '#e5e7eb',
                            background: '#f9fafb',
                            color: '#374151',
                          }}
                          onFocus={(e) => { e.target.style.borderColor = '#e85d04'; e.target.style.background = '#ffffff'; }}
                          onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                        />
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() || sending}
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90 disabled:opacity-40"
                          style={{ background: '#e85d04', color: 'white' }}
                        >
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* CSS pentru animatia punctelor loading */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;