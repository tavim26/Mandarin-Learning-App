// --- Enumerari ---

export type MessageSender = 'STUDENT' | 'AI';

// --- DTOs primite de la backend ---

export interface ChatSessionDto {
  id: number;
  studentId: number;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
  lastMessagePreview: string | null;
  messageCount: number;
}

export interface ChatMessageDto {
  id: number;
  sessionId: number;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

// Returnat la POST .../messages — contine mesajul studentului SI raspunsul AI
export interface SendMessageResponse {
  userMessage: ChatMessageDto;
  aiMessage: ChatMessageDto;
}

// --- Request bodies ---

export interface CreateSessionRequest {
  title?: string;
}

export interface SendMessageRequest {
  content: string;
}