import apiClient from '@/api/client';

export type ConcessionType =
  | 'subscription_trial'
  | 'subscription_price'
  | 'subscription_duration'
  | 'listing_fee_waiver'
  | 'listing_fee_custom';

export type ConcessionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ConcessionSource = 'sales' | 'supplier';

export interface ConcessionProposal {
  price?: number;
  durationMonths?: number;
  trialDays?: number;
  tier?: 'VERIFIED' | 'GAMMA' | 'BETA';
  perProduct?: number;
  minMonthly?: number;
  until?: string;
}

export interface ConcessionRequest {
  _id: string;
  supplierId: string | { _id: string; businessName?: string; tier?: string; subscription?: { status?: string } };
  requestedBy: string | { _id: string; name?: string; email?: string; role?: string };
  source: ConcessionSource;
  type: ConcessionType;
  proposal: ConcessionProposal;
  reason: string;
  status: ConcessionStatus;
  decidedBy?: string | { _id: string; name?: string; role?: string };
  decidedAt?: string;
  decisionNote?: string;
  appliedSnapshot?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConcessionInput {
  supplierId: string;
  type: ConcessionType;
  proposal: ConcessionProposal;
  reason: string;
}

const concessionApi = {
  // ── Admin queue ──────────────────────────────────────────────────────────
  list: async (status: ConcessionStatus | 'all' = 'pending'): Promise<ConcessionRequest[]> => {
    const res = await apiClient.get('/admin/concessions', { params: { status } });
    return res.data.requests;
  },
  approve: async (id: string, decisionNote?: string): Promise<ConcessionRequest> => {
    const res = await apiClient.post(`/admin/concessions/${id}/approve`, { decisionNote });
    return res.data.request;
  },
  reject: async (id: string, decisionNote: string): Promise<ConcessionRequest> => {
    const res = await apiClient.post(`/admin/concessions/${id}/reject`, { decisionNote });
    return res.data.request;
  },

  // ── Sales sub-admin: recommend + own history ─────────────────────────────
  create: async (input: CreateConcessionInput): Promise<ConcessionRequest> => {
    const res = await apiClient.post('/admin/concessions', input);
    return res.data.request;
  },
  listMine: async (): Promise<ConcessionRequest[]> => {
    const res = await apiClient.get('/admin/concessions/mine');
    return res.data.requests;
  },

  // ── Direct admin grants ──────────────────────────────────────────────────
  grantTrial: async (
    supplierId: string,
    input: { tier: 'VERIFIED' | 'GAMMA' | 'BETA'; trialDays: number; reason: string }
  ) => {
    const res = await apiClient.post(`/admin/suppliers/${supplierId}/grant-trial`, input);
    return res.data.supplier;
  },
  setSubscriptionOverride: async (
    supplierId: string,
    input: { customPrice?: number | null; customDurationMonths?: number | null; reason: string }
  ) => {
    const res = await apiClient.post(`/admin/suppliers/${supplierId}/subscription-override`, input);
    return res.data.supplier;
  },
  setListingFeeOverride: async (
    supplierId: string,
    input: {
      perProduct?: number | null;
      minMonthly?: number | null;
      waived?: boolean;
      waivedUntil?: string | null;
      reason: string;
    }
  ) => {
    const res = await apiClient.post(`/admin/suppliers/${supplierId}/listing-fee-override`, input);
    return res.data.supplier;
  },
  clearListingFeeOverride: async (supplierId: string) => {
    const res = await apiClient.delete(`/admin/suppliers/${supplierId}/listing-fee-override`);
    return res.data.supplier;
  },
  history: async (supplierId: string): Promise<ConcessionRequest[]> => {
    const res = await apiClient.get(`/admin/suppliers/${supplierId}/concession-history`);
    return res.data.history;
  },
};

export default concessionApi;
