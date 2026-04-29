import apiClient from '@/api/client';

export interface ResellerProfile {
  _id?: string;
  fullName?: string;
  storeName?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  email?: string;
  phone?: string;
  isEmailVerified?: boolean;
  profileType?: 'Individual Reseller' | 'Business Reseller';
  profileDescription?: string;
  profileImage?: string;
  platforms?: string[];
  socialLinks?: Record<string, string>;
  primarySellingMethod?: 'Direct to customers' | 'To retailers/shopkeepers' | 'Both';
  monthlyVolume?: '0–50 orders' | '50–200' | '200–500' | '500+';
  reach?: 'Local' | 'State' | 'Pan India' | 'International';
  experience?: 'Beginner' | '1–2 years' | '3+ years';
  soldBefore?: boolean;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  panNumber?: string;
  gstNumber?: string;
  idProofUrl?: string;
  subscriptionPlan?: 'Starter' | 'Basic' | 'Standard' | 'Premium';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  step?: number;
  createdAt?: string;
  updatedAt?: string;
}

const resellerService = {
  getProfile: async () => {
    const response = await apiClient.get('/reseller/me');
    return response.data;
  },

  onboard: async (data: any) => {
    const response = await apiClient.post('/reseller/onboard', data);
    return response.data;
  },

  uploadDoc: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/reseller/upload-doc', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  requestProduct: async (productId: string) => {
    const response = await apiClient.post('/partnership/request', { productId });
    return response.data;
  },

  getRequests: async () => {
    const response = await apiClient.get('/partnership/my-requests');
    return response.data;
  },

  updateProfile: async (data: Partial<ResellerProfile>) => {
    const response = await apiClient.put('/reseller/profile', data);
    return response.data;
  }
};

export default resellerService;
