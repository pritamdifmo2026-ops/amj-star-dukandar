import apiClient from '@/api/client';

export const addressApi = {
  getAddresses: async () => {
    const response = await apiClient.get('/addresses');
    return response.data;
  },
  addAddress: async (addressData: any) => {
    const response = await apiClient.post('/addresses', addressData);
    return response.data;
  },
  updateAddress: async (id: string, addressData: any) => {
    const response = await apiClient.put(`/addresses/${id}`, addressData);
    return response.data;
  },
  deleteAddress: async (id: string) => {
    await apiClient.delete(`/addresses/${id}`);
  },
  setDefault: async (id: string) => {
    const response = await apiClient.patch(`/addresses/${id}/default`);
    return response.data;
  }
};
