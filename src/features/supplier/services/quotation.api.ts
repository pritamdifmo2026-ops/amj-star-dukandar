import apiClient from '@/api/client';

export const quotationApi = {
  getSupplierQuotations: async () => {
    const res = await apiClient.get('/quotations');
    return res.data;
  },
  createQuotation: async (data: any) => {
    const res = await apiClient.post('/quotations/create', data);
    return res.data;
  },
  getQuotation: async (id: string) => {
    const res = await apiClient.get(`/quotations/${id}`);
    return res.data;
  },
  acceptQuotation: async (id: string, paymentMethod: 'direct' | 'amjstar' = 'direct') => {
    const res = await apiClient.post(`/quotations/${id}/accept`, { paymentMethod });
    return res.data;
  },
  rejectQuotation: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/reject`);
    return res.data;
  },
  counterOffer: async (id: string, data: { price?: number; quantity?: number; note?: string; deliveryTimeline?: string }) => {
    const res = await apiClient.post(`/quotations/${id}/counter`, data);
    return res.data;
  },
  cancelQuotation: async (id: string, reason: string) => {
    const res = await apiClient.post(`/quotations/${id}/cancel`, { reason });
    return res.data;
  },
};
