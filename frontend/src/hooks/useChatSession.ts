import { useState, useCallback, useRef } from 'react';
import { chatbotApi } from '@/api/chatbotApi';
import type {
  ChatSessionDto,
  ChatMessageDto,
  CreateSessionRequest,
} from '@/types';


export type { ChatSessionDto, ChatMessageDto } from '@/types';


export const useChatSession = () => {
  const [sessions, setSessions] = useState<ChatSessionDto[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionDto | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  // isSending separat — inputul trebuie blocat 2-5s cat raspunde Gemini
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref pentru scroll automat la ultimul mesaj
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);
    try {
      const data = await chatbotApi.getSessions();
      setSessions(data);
    } catch {
      setError('Nu s-au putut incarca sesiunile.');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const openSession = useCallback(async (session: ChatSessionDto) => {
    setActiveSession(session);
    setIsLoadingMessages(true);
    setError(null);
    try {
      const data = await chatbotApi.getMessages(session.id);
      setMessages(data);
    } catch {
      setError('Nu s-au putut incarca mesajele.');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const createSession = async (
    data: CreateSessionRequest
  ): Promise<ChatSessionDto | null> => {
    try {
      const created = await chatbotApi.createSession(data);
      setSessions((prev) => [created, ...prev]);
      setActiveSession(created);
      setMessages([]);
      return created;
    } catch {
      setError('Crearea sesiunii a esuat.');
      return null;
    }
  };

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!activeSession || activeSession.endedAt !== null) return false;

    setIsSending(true);
    setError(null);
    try {
      const res = await chatbotApi.sendMessage(activeSession.id, { content });
      setMessages((prev) => [...prev, res.userMessage, res.aiMessage]);

      // Actualizeaza preview-ul sesiunii in sidebar
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                lastMessagePreview: res.aiMessage.content.slice(0, 60),
                messageCount: s.messageCount + 2,
              }
            : s
        )
      );

      setTimeout(scrollToBottom, 50);
      return true;
    } catch (err: unknown) {
      const status =
        (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setError('Sesiunea este inchisa. Nu mai pot fi trimise mesaje.');
      } else if (status === 503) {
        setError('Serviciul AI este momentan indisponibil. Incearca din nou.');
      } else {
        setError('Trimiterea mesajului a esuat.');
      }
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const endSession = async (): Promise<boolean> => {
    if (!activeSession) return false;
    try {
      const updated = await chatbotApi.endSession(activeSession.id);
      setActiveSession(updated);
      setSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      return true;
    } catch {
      setError('Inchiderea sesiunii a esuat.');
      return false;
    }
  };

  const renameSession = async (
    sessionId: number,
    newTitle: string
  ): Promise<boolean> => {
    try {
      const updated = await chatbotApi.renameSession(sessionId, newTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      );
      if (activeSession?.id === sessionId) {
        setActiveSession(updated);
      }
      return true;
    } catch {
      setError('Redenumirea sesiunii a esuat.');
      return false;
    }
  };

  const deleteSession = async (sessionId: number): Promise<boolean> => {
    try {
      await chatbotApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
      return true;
    } catch {
      setError('Stergerea sesiunii a esuat.');
      return false;
    }
  };

  const isSessionClosed = activeSession?.endedAt !== null;

  return {
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
    renameSession,
    deleteSession,
  };
};