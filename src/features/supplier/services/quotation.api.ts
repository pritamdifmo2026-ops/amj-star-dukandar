import apiClient from '@/api/client';

export const quotationApi = {
  getSupplierQuotations: async () => {
    const res = await apiClient.get('/quotations');
    return res.data;
  },
  createQuotation: async (data: any) => {
    const res = await apiClient.post('/quotations', data);
    return res.data;
  },
  getQuotation: async (id: string) => {
    const res = await apiClient.get(`/quotations/${id}`);
    return res.data;
  },
  acceptQuotation: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/accept`);
    return res.data;
  },
  rejectQuotation: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/reject`);
    return res.data;
  },
  counterOffer: async (id: string, data: { price: number; quantity?: number; note?: string }) => {
    const res = await apiClient.post(`/quotations/${id}/counter`, data);
    return res.data;
  },
  acceptCounter: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/accept-counter`);
    return res.data;
  },
  rejectCounter: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/reject-counter`);
    return res.data;
  },
  deleteQuotation: async (id: string) => {
    const res = await apiClient.delete(`/quotations/${id}`);
    return res.data;
  },
  updateQuotation: async (id: string, data: any) => {
    const res = await apiClient.patch(`/quotations/${id}`, data);
    return res.data;
  },
  cancelQuotation: async (id: string, reason: string) => {
    const res = await apiClient.post(`/quotations/${id}/cancel`, { reason });
    return res.data;
  },
};
