import { useState, useCallback } from 'react';
import {
  getSessions,
  createSession,
  getMessages,
  sendMessage,
  deleteSession,
} from '@/api/chatbotApi';
import type { ChatSessionDto, ChatMessageDto, SendMessageRequest } from '@/types';

interface ChatSessionState {
  sessions: ChatSessionDto[];
  activeSession: ChatSessionDto | null;
  messages: ChatMessageDto[];
  input: string;
  loadingSessions: boolean;
  loadingMessages: boolean;
  sending: boolean;
  sendError: string | null;
  isClosed: boolean;
  setInput: (value: string) => void;
  fetchSessions: () => Promise<void>;
  selectSession: (session: ChatSessionDto) => Promise<void>;
  newSession: () => Promise<void>;
  send: () => Promise<void>;
  removeSession: (sessionId: number) => Promise<void>;
  clearError: () => void;
}

export const useChatSession = (): ChatSessionState => {
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoadingSessions(true);
      const data = await getSessions();
      setSessions(data);
    } catch {
      // Sesiunile nu se incarca — UI ramane gol
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const selectSession = async (session: ChatSessionDto) => {
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

  const newSession = async () => {
    try {
      const session = await createSession({});
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setSendError(null);
    } catch {
      // Nu s-a putut crea sesiunea
    }
  };

  const send = async () => {
    if (!input.trim() || !activeSession || sending) return;
    if (activeSession.endedAt !== null) return;

    const content = input.trim();
    setInput('');
    setSendError(null);
    setSending(true);

    // Optimistic update — mesajul studentului apare imediat
    const optimisticMsg: ChatMessageDto = {
      id: -1,
      sessionId: activeSession.id,
      sender: 'STUDENT',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const data: SendMessageRequest = { content };
      const response = await sendMessage(activeSession.id, data);

      // Inlocuieste mesajul optimistic cu cel real + adauga raspunsul AI
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== -1),
        response.userMessage,
        response.aiMessage,
      ]);

      // Actualizeaza preview-ul sesiunii in lista
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                title: s.title ?? content.slice(0, 40),
                lastMessagePreview: response.aiMessage.content.slice(0, 60),
              }
            : s
        )
      );
    } catch (err: unknown) {
      // Rollback optimistic update
      setMessages((prev) => prev.filter((m) => m.id !== -1));
      setInput(content);

      if (err instanceof Error && err.message.includes('503')) {
        setSendError('503');
      } else if (err instanceof Error && err.message.includes('409')) {
        setSendError('409');
      } else {
        setSendError('unknown');
      }
    } finally {
      setSending(false);
    }
  };

  const removeSession = async (sessionId: number) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch {
      // Stergerea a esuat — UI ramane neschimbat
    }
  };

  const clearError = () => setSendError(null);

  return {
    sessions,
    activeSession,
    messages,
    input,
    loadingSessions,
    loadingMessages,
    sending,
    sendError,
    isClosed: activeSession?.endedAt !== null,
    setInput,
    fetchSessions,
    selectSession,
    newSession,
    send,
    removeSession,
    clearError,
  };
}; 