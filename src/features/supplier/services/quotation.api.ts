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
  }
};
