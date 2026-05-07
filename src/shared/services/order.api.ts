import apiClient from '@/api/client';

export const orderApi = {
  getOrders: async () => {
    const res = await apiClient.get('/orders');
    return res.data.data;
  },
  getOrderById: async (id: string) => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data.data;
  }
};
