import apiClient from './client';
import type {
  ChatSessionDto,
  ChatMessageDto,
  SendMessageResponse,
  CreateSessionRequest,
  SendMessageRequest,
  PagedResponse,
} from '@/types';

export const chatbotApi = {
 
  createSession: async (
    data: CreateSessionRequest
  ): Promise<ChatSessionDto> => {
    const res = await apiClient.post<ChatSessionDto>(
      '/api/chatbot/sessions',
      data
    );
    return res.data;
  },

  getSessions: async (): Promise<ChatSessionDto[]> => {
    const res = await apiClient.get<ChatSessionDto[]>('/api/chatbot/sessions');
    return res.data;
  },

  getSessionsPaged: async (
    page = 0,
    size = 10
  ): Promise<PagedResponse<ChatSessionDto>> => {
    const res = await apiClient.get<PagedResponse<ChatSessionDto>>(
      '/api/chatbot/sessions/paged',
      { params: { page, size } }
    );
    return res.data;
  },

  endSession: async (sessionId: number): Promise<ChatSessionDto> => {
    const res = await apiClient.patch<ChatSessionDto>(
      `/api/chatbot/sessions/${sessionId}/end`
    );
    return res.data;
  },

  renameSession: async (
    sessionId: number,
    newTitle: string
  ): Promise<ChatSessionDto> => {
    const res = await apiClient.patch<ChatSessionDto>(
      `/api/chatbot/sessions/${sessionId}/rename`,
      null,
      { params: { newTitle } }
    );
    return res.data;
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`/api/chatbot/sessions/${sessionId}`);
  },

  
  sendMessage: async (
    sessionId: number,
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const res = await apiClient.post<SendMessageResponse>(
      `/api/chatbot/sessions/${sessionId}/messages`,
      data
    );
    return res.data;
  },

  getMessages: async (sessionId: number): Promise<ChatMessageDto[]> => {
    const res = await apiClient.get<ChatMessageDto[]>(
      `/api/chatbot/sessions/${sessionId}/messages`
    );
    return res.data;
  },

  getMessagesPaged: async (
    sessionId: number,
    page = 0,
    size = 20
  ): Promise<PagedResponse<ChatMessageDto>> => {
    const res = await apiClient.get<PagedResponse<ChatMessageDto>>(
      `/api/chatbot/sessions/${sessionId}/messages/paged`,
      { params: { page, size } }
    );
    return res.data;
  },
};