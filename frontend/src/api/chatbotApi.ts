import apiClient from './client';

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
  sender: 'STUDENT' | 'AI';
  content: string;
  createdAt: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessageDto;
  aiMessage: ChatMessageDto;
}

export const getSessions = async (): Promise<ChatSessionDto[]> => {
  const response = await apiClient.get<ChatSessionDto[]>('/api/chatbot/sessions');
  return response.data;
};

export const createSession = async (title?: string): Promise<ChatSessionDto> => {
  const response = await apiClient.post<ChatSessionDto>('/api/chatbot/sessions', {
    title: title ?? null,
  });
  return response.data;
};

export const getMessages = async (sessionId: number): Promise<ChatMessageDto[]> => {
  const response = await apiClient.get<ChatMessageDto[]>(
    `/api/chatbot/sessions/${sessionId}/messages`
  );
  return response.data;
};

export const sendMessage = async (
  sessionId: number,
  content: string
): Promise<SendMessageResponse> => {
  const response = await apiClient.post<SendMessageResponse>(
    `/api/chatbot/sessions/${sessionId}/messages`,
    { content }
  );
  return response.data;
};

export const endSession = async (sessionId: number): Promise<ChatSessionDto> => {
  const response = await apiClient.patch<ChatSessionDto>(
    `/api/chatbot/sessions/${sessionId}/end`
  );
  return response.data;
};

export const deleteSession = async (sessionId: number): Promise<void> => {
  await apiClient.delete(`/api/chatbot/sessions/${sessionId}`);
};

export const renameSession = async (
  sessionId: number,
  newTitle: string
): Promise<ChatSessionDto> => {
  const response = await apiClient.patch<ChatSessionDto>(
    `/api/chatbot/sessions/${sessionId}/rename`,
    null,
    { params: { newTitle } }
  );
  return response.data;
};