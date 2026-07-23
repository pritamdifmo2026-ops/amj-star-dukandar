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
  storeSlug?: string;
  storefront?: StorefrontSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface StorefrontSettings {
  bannerImage?: string;
  themeColor?: string;
  announcement?: string;
}

export interface Lead {
  _id: string;
  customerName: string;
  phone: string;
  email?: string;
  productName?: string;
  message?: string;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  notes?: string;
  createdAt: string;
}

export interface PublicStoreData {
  store: {
    _id: string;
    storeName: string;
    storeSlug: string;
    fullName?: string;
    profileDescription?: string;
    profileImage?: string;
    storefront?: StorefrontSettings;
    city?: string;
    state?: string;
    country?: string;
    createdAt?: string;
  };
  products: Array<{
    partnershipId: string;
    name: string;
    description?: string;
    highlights: string[];
    price: number;
    images: string[];
    category?: string;
    unit?: string;
    moq?: number;
  }>;
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
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
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
  },

  updateProductCustomization: async (partnershipId: string, data: any) => {
    const response = await apiClient.put(`/partnership/customization/${partnershipId}`, data);
    return response.data;
  },

  // ─── Storefront ────────────────────────────────────────────────────────────

  updateStorefrontSettings: async (data: StorefrontSettings) => {
    const response = await apiClient.put('/reseller/storefront', data);
    return response.data;
  },

  getGlobalResellerProducts: async () => {
    const response = await apiClient.get('/partnership/public/products');
    return response.data;
  },

  getPublicStore: async (slug: string): Promise<PublicStoreData> => {
    const response = await apiClient.get(`/reseller/public/${slug}`);
    return response.data;
  },

  submitStoreLead: async (slug: string, data: {
    customerName: string; phone: string; email?: string; message?: string;
    partnershipId?: string; productName?: string;
  }) => {
    const response = await apiClient.post(`/reseller/public/${slug}/lead`, data);
    return response.data;
  },

  submitStoreOrder: async (slug: string, data: {
    partnershipId?: string; quantity: number; addressSnapshot: any;
  }) => {
    const response = await apiClient.post(`/reseller/public/${slug}/order`, data);
    return response.data;
  },

  // ─── Leads ─────────────────────────────────────────────────────────────────

  getLeads: async (): Promise<{ leads: Lead[] }> => {
    const response = await apiClient.get('/reseller/leads');
    return response.data;
  },

  updateLead: async (leadId: string, data: { status?: Lead['status']; notes?: string }) => {
    const response = await apiClient.patch(`/reseller/leads/${leadId}`, data);
    return response.data;
  },

  // ─── Customer orders ───────────────────────────────────────────────────────

  getOrders: async () => {
    const response = await apiClient.get('/reseller/orders');
    return response.data;
  },

  // ─── Wallet (shared endpoints, reseller role allowed) ──────────────────────

  getWallet: async () => {
    const response = await apiClient.get('/wallet');
    return response.data;
  },

  getWalletTransactions: async (page = 1, limit = 20) => {
    const response = await apiClient.get(`/wallet/transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  requestWithdrawal: async (amount: number, bankDetails?: {
    accountName: string; accountNumber: string; ifscCode: string; bankName: string;
  }) => {
    const response = await apiClient.post('/wallet/withdraw', { amount, bankDetails });
    return response.data;
  },

  getWithdrawals: async () => {
    const response = await apiClient.get('/wallet/withdrawals');
    return response.data;
  }
};

export default resellerService;
