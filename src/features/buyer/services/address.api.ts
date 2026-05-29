import apiClient from '@/api/client';

export interface AddressPayload {
  fullName: string;
  phone: string;
  pincode: string;
  state: string;
  city: string;
  houseNo: string;
  area: string;
  isDefault: boolean;
}

export const addressApi = {
  getAddresses: async () => {
    const response = await apiClient.get('/addresses');
    return response.data;
  },
  addAddress: async (addressData: AddressPayload) => {
    const response = await apiClient.post('/addresses', addressData);
    return response.data;
  },
  updateAddress: async (id: string, addressData: AddressPayload) => {
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
