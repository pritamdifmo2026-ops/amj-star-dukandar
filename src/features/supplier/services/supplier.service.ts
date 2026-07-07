import apiClient from '@/api/client';
import { SupplierTier } from '@/features/supplier/store/supplier.slice';

const supplierService = {
  getProfile: async () => {
    const response = await apiClient.get('/supplier/me');
    return response.data;
  },

  reapply: async () => {
    const response = await apiClient.post('/supplier/reapply');
    return response.data;
  },

  toggleOwnShipping: async () => {
    const response = await apiClient.patch('/supplier/own-shipping');
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

  getPlans: async () => {
    const response = await apiClient.get('/supplier/plans');
    return response.data;
  },

  createSubscriptionOrder: async () => {
    const response = await apiClient.post('/supplier/subscription/order');
    return response.data;
  },

  verifySubscription: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await apiClient.post('/supplier/subscription/verify', data);
    return response.data;
  },

  createUpgradeOrder: async (targetTier: SupplierTier) => {
    const response = await apiClient.post('/supplier/upgrade/order', { targetTier });
    return response.data;
  },

  verifyUpgrade: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await apiClient.post('/supplier/upgrade/verify', data);
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
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
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
  
  sendVerificationEmail: async () => {
    const response = await apiClient.post('/supplier/send-verification-email', {}, { timeout: 60000 });
    return response.data;
  },

  requestEmailChange: async (newEmail: string) => {
    const response = await apiClient.post('/supplier/request-email-change', { newEmail }, { timeout: 60000 });
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
  },

  // Bank Management
  addBank: async (data: { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string }) => {
    const response = await apiClient.post('/supplier/banks', data);
    return response.data;
  },

  getBanks: async () => {
    const response = await apiClient.get('/supplier/banks');
    return response.data;
  },

  editBank: async (bankId: string, data: { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string }) => {
    const response = await apiClient.put(`/supplier/banks/${bankId}`, data);
    return response.data;
  },

  deleteBank: async (bankId: string) => {
    const response = await apiClient.delete(`/supplier/banks/${bankId}`);
    return response.data;
  },

  setPrimaryBank: async (bankId: string) => {
    const response = await apiClient.patch(`/supplier/banks/${bankId}/set-primary`);
    return response.data;
  },

  getShippingZones: async () => {
    const response = await apiClient.get('/supplier/shipping-zones');
    return response.data;
  },

  updateShippingZones: async (zones: { local: number; regional: number; national: number }) => {
    const response = await apiClient.put('/supplier/shipping-zones', zones);
    return response.data;
  },
};

export default supplierService;
