import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export const chatApi = {
  getOrCreateConversation: async (
    supplierId: string,
    productId?: string,
    buyerAddress?: { fullAddress?: string; city?: string; state?: string; pincode?: string },
  ) => {
    const res = await apiClient.post(ENDPOINTS.CHAT.CONVERSATION, { supplierId, productId, buyerAddress });
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

  deleteConversation: async (conversationId: string) => {
    await apiClient.delete(`/chat/conversations/${conversationId}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get(ENDPOINTS.CHAT.UNREAD_COUNT);
    return res.data.data.count as number;
  },
};
