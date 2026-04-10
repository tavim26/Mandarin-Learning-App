import type { PagedResponse } from './common';
export type { PagedResponse };

export type MessageSender = 'STUDENT' | 'AI';

export interface ChatSessionDto {
  id: number;
  studentId: number;
  title: string;
  startedAt: string;
  endedAt: string | null;          // null = sesiune activa
  lastMessagePreview: string | null; // null daca nu are mesaje; trunchiat la 60 chars
  messageCount: number;
  customInstructions: string | null;
}

export interface ChatMessageDto {
  id: number;
  sessionId: number;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessageDto;
  aiMessage: ChatMessageDto;
}

export interface CreateSessionRequest {
  title?: string;
  customInstructions?: string;
}

export interface SendMessageRequest {
  content: string;
}
