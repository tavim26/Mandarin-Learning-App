import apiClient from './client';
import type {
  ChatSessionDto,
  ChatMessageDto,
  SendMessageResponse,
  PagedResponse,
  CreateSessionRequest,
  SendMessageRequest,
} from '@/types';

// --- Sesiuni ---

export const getSessions = async (): Promise<ChatSessionDto[]> => {
  const response = await apiClient.get<ChatSessionDto[]>('/api/chatbot/sessions');
  return response.data;
};

export const getSessionsPaged = async (
  page = 0,
  size = 10
): Promise<PagedResponse<ChatSessionDto>> => {
  const response = await apiClient.get<PagedResponse<ChatSessionDto>>(
    '/api/chatbot/sessions/paged',
    { params: { page, size } }
  );
  return response.data;
};

export const createSession = async (
  data: CreateSessionRequest = {}
): Promise<ChatSessionDto> => {
  const response = await apiClient.post<ChatSessionDto>('/api/chatbot/sessions', data);
  return response.data;
};

export const endSession = async (sessionId: number): Promise<ChatSessionDto> => {
  const response = await apiClient.patch<ChatSessionDto>(
    `/api/chatbot/sessions/${sessionId}/end`
  );
  return response.data;
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

export const deleteSession = async (sessionId: number): Promise<void> => {
  await apiClient.delete(`/api/chatbot/sessions/${sessionId}`);
};

// --- Mesaje ---

export const getMessages = async (sessionId: number): Promise<ChatMessageDto[]> => {
  const response = await apiClient.get<ChatMessageDto[]>(
    `/api/chatbot/sessions/${sessionId}/messages`
  );
  return response.data;
};

export const getMessagesPaged = async (
  sessionId: number,
  page = 0,
  size = 20
): Promise<PagedResponse<ChatMessageDto>> => {
  const response = await apiClient.get<PagedResponse<ChatMessageDto>>(
    `/api/chatbot/sessions/${sessionId}/messages/paged`,
    { params: { page, size } }
  );
  return response.data;
};

export const sendMessage = async (
  sessionId: number,
  data: SendMessageRequest
): Promise<SendMessageResponse> => {
  const response = await apiClient.post<SendMessageResponse>(
    `/api/chatbot/sessions/${sessionId}/messages`,
    data
  );
  return response.data;
};