import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export const chatApi = {
  getOrCreateConversation: async (supplierId: string, productId?: string) => {
    const res = await apiClient.post(ENDPOINTS.CHAT.CONVERSATION, { supplierId, productId });
    return res.data.data;
  },

  getConversations: async () => {
    const res = await apiClient.get(ENDPOINTS.CHAT.CONVERSATIONS);
    return res.data.data;
  },

  getMessages: async (conversationId: string) => {
    const res = await apiClient.get(ENDPOINTS.CHAT.MESSAGES(conversationId));
    return res.data.data;
  },
};
