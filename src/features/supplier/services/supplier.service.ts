import apiClient from '@/api/client';
import { SupplierTier } from '@/store/slices/supplier.slice';

const supplierService = {
  getProfile: async () => {
    const response = await apiClient.get('/supplier/me');
    return response.data;
  },

  onboard: async (data: { businessName: string; phone: string; ownerName: string; email: string; isWomenEntrepreneur: boolean }) => {
    const response = await apiClient.post('/supplier/onboard', data);
    return response.data;
  },

  selectTier: async (tier: SupplierTier) => {
    const response = await apiClient.post('/supplier/select-tier', { tier });
    return response.data;
  },

  submitKYC: async (details: any) => {
    const response = await apiClient.post('/supplier/kyc', details);
    return response.data;
  },

  saveDraft: async (details: any) => {
    const response = await apiClient.post('/supplier/draft', details);
    return response.data;
  },
  
  uploadDoc: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/supplier/upload-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default supplierService;
