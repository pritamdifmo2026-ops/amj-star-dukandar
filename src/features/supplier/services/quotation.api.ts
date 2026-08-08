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
  acceptQuotation: async (id: string, paymentMethod: 'direct' | 'amjstar' = 'direct', buyerSignature?: string) => {
    const response = await apiClient.post(`/quotations/${id}/accept`, { paymentMethod, buyerSignature });
    return response.data;
  },
  supplierApprove: async (id: string) => {
    const response = await apiClient.post(`/quotations/${id}/supplier-approve`);
    return response.data;
  },
  rejectQuotation: async (id: string) => {
    const res = await apiClient.post(`/quotations/${id}/reject`);
    return res.data;
  },
  counterOffer: async (id: string, data: { price?: number; quantity?: number; note?: string; deliveryTimeline?: string; paymentTerms?: string; transportationTerms?: string }) => {
    const res = await apiClient.post(`/quotations/${id}/counter`, data);
    return res.data;
  },
  cancelQuotation: async (id: string, reason: string) => {
    const res = await apiClient.post(`/quotations/${id}/cancel`, { reason });
    return res.data;
  },
};
