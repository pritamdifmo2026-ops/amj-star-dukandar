import apiClient from '@/api/client';
import { SupplierTier } from '@/store/slices/supplier.slice';

const supplierService = {
  getProfile: async () => {
    const response = await apiClient.get('/supplier/me');
    return response.data;
  },

  onboard: async (data: { businessName: string; phone: string; ownerName: string; email: string }) => {
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
  },

  getPartnershipRequests: async () => {
    const response = await apiClient.get('/partnership/incoming-requests');
    return response.data;
  },

  respondToRequest: async (partnershipId: string, action: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    const response = await apiClient.post(`/partnership/respond/${partnershipId}`, { action, rejectionReason });
    return response.data;
  },

  getPartners: async () => {
    const response = await apiClient.get('/partnership/partners');
    return response.data;
  },
  
  requestEmailChange: async (newEmail: string) => {
    const response = await apiClient.post('/supplier/request-email-change', { newEmail });
    return response.data;
  },

  verifyEmailChange: async (token: string) => {
    const response = await apiClient.get(`/supplier/verify-email-change?token=${token}`);
    return response.data;
  },

  requestPhoneChange: async (newPhone: string) => {
    const response = await apiClient.post('/supplier/request-phone-change', { newPhone });
    return response.data;
  },

  verifyPhoneChange: async (otp: string) => {
    const response = await apiClient.post('/supplier/verify-phone-change', { otp });
    return response.data;
  }
};

export default supplierService;
