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

const billingApi = {
  getPreview: async (): Promise<{ success: boolean; preview: BillingPreview }> => {
    const res = await apiClient.get('/supplier/billing-preview');
    return res.data;
  },
  getHistory: async (page = 1, limit = 10): Promise<{ success: boolean } & BillingHistoryResponse> => {
    const res = await apiClient.get('/supplier/billing-history', { params: { page, limit } });
    return res.data;
  }
};

export default billingApi;
