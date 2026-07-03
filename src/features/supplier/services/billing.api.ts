import apiClient from '@/api/client';

export interface BillingPreview {
  onboardingDate: string;
  nextBillingDate: string | null;
  totalBillableProducts: number;
  projectedCost: number;
  walletBalance: number;
  shortfallAmount: number;
  productsToKeep: number;
  productsToBlock: number;
}

export interface BillingHistoryRecord {
  _id: string;
  billingDate: string;
  amountCharged: number;
  totalLiveProducts: number;
  productsKept: number;
  productsBlocked: number;
  blockedProductIds: any[];
}

export interface BillingHistoryResponse {
  history: BillingHistoryRecord[];
  totalPages: number;
  currentPage: number;
}

export interface SubscriptionPaymentRecord {
  _id: string;
  invoiceNumber: string;
  type: 'subscription' | 'upgrade';
  tier: string;
  fromTier?: string;
  planName: string;
  price: number;
  gstPercent: number;
  gstAmount: number;
  amountPaid: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  planStartDate: string;
  planExpiryDate: string;
  createdAt: string;
}

export interface SubscriptionPaymentResponse {
  payments: SubscriptionPaymentRecord[];
  totalPages: number;
  currentPage: number;
}

const billingApi = {
  getPreview: async (): Promise<{ success: boolean; preview: BillingPreview }> => {
    const res = await apiClient.get('/supplier/billing-preview');
    return res.data;
  },
  getHistory: async (page = 1, limit = 10): Promise<{ success: boolean } & BillingHistoryResponse> => {
    const res = await apiClient.get('/supplier/billing-history', { params: { page, limit } });
    return res.data;
  },
  getSubscriptionPayments: async (page = 1, limit = 10): Promise<{ success: boolean } & SubscriptionPaymentResponse> => {
    const res = await apiClient.get('/supplier/subscription-payments', { params: { page, limit } });
    return res.data;
  },
};

export default billingApi;
