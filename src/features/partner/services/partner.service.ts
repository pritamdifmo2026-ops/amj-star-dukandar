import apiClient from '@/api/client';

export interface PartnerBankDetails {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
  isVerified?: boolean;
}

export interface PartnerMetrics {
  totalSuppliersOnboarded: number;
  totalBuyersOnboarded: number;
  totalOrdersReferred: number;
  lifetimeGrossVolume: number;
  lifetimeCommissionEarned: number;
}

export interface PartnerWallet {
  pendingBalance: number;
  withdrawableBalance: number;
  totalWithdrawn: number;
  /** Requested or processing payouts — already debited, not yet paid out. */
  inFlightPayouts?: number;
}

export type PartnerStatus = 'active' | 'suspended' | 'pending_approval' | 'pending' | 'rejected';

export interface PartnerProfile {
  _id: string;
  userId: string | { _id?: string; name?: string; email?: string; phone?: string; createdAt?: string };
  partnerCode: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  panNumber?: string;
  gstin?: string;
  city?: string;
  state?: string;
  commissionSharePercent: number;
  sellerCommissionPercent?: number;
  buyerCommissionPercent?: number;
  status: PartnerStatus;
  registrationSource?: 'self' | 'admin';
  applicationNote?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  bankDetails?: PartnerBankDetails;
  metrics: PartnerMetrics;
  wallet: PartnerWallet;
  createdAt: string;
  updatedAt: string;
}

/** True while the account is waiting on an admin decision. */
export function isPartnerPending(status?: PartnerStatus | string): boolean {
  return status === 'pending_approval' || status === 'pending';
}

export interface PartnerCommissionItem {
  _id: string;
  partnerId: string;
  orderId: string;
  orderNumber: string;
  orderSubtotal: number;
  amjPlatformFee: number;
  partnerSharePercent: number;
  earnedAmount: number;
  attributionType: 'buyer_referred' | 'supplier_referred' | 'both';
  status: 'pending' | 'cleared' | 'reversed';
  clearedAt?: string;
  reversedReason?: string;
  createdAt: string;
}

export interface PartnerCommissionSummary {
  pending: number;
  cleared: number;
  reversed: number;
  pendingCount: number;
  clearedCount: number;
  reversedCount: number;
}

export interface PopulatedPartnerSummary {
  _id?: string;
  partnerCode?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  panNumber?: string;
  gstin?: string;
  businessName?: string;
}

export interface PartnerPayoutItem {
  _id: string;
  partnerId: string | PopulatedPartnerSummary;
  amount: number;
  tdsRate?: number;
  tdsDeducted: number;
  netPayable: number;
  bankSnapshot: PartnerBankDetails;
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  paymentReference?: string;
  paidAt?: string;
  processedByAdminId?: { name?: string; email?: string } | string;
  createdAt: string;
}

/** A referred account with its transacted volume folded in. */
export interface PartnerReferredBuyer {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt: string;
  orders: number;
  volume: number;
}

export interface PartnerReferredSupplier {
  _id: string;
  userId?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  kycStatus?: string;
  onboardingStatus?: string;
  tier?: string;
  subscription?: { status?: string; tier?: string; expiryDate?: string; trialExpiryDate?: string };
  isActive?: boolean;
  createdAt: string;
  orders: number;
  volume: number;
}

export interface PartnerReferrals {
  buyers: PartnerReferredBuyer[];
  suppliers: PartnerReferredSupplier[];
  totalBuyers: number;
  totalSuppliers: number;
}

export interface PartnerReferralLinks {
  buyer: string;
  supplier: string;
  reseller: string;
  generic: string;
}

export interface PartnerDashboardData {
  success: boolean;
  partner: PartnerProfile;
  metrics: PartnerMetrics;
  wallet: PartnerWallet;
  referralLinks: PartnerReferralLinks;
  recentCommissions: PartnerCommissionItem[];
  counts: {
    openDisputes: number;
    openIssues: number;
    pendingConcessions: number;
    totalReferredOrders: number;
  };
  approval: {
    isPendingApproval: boolean;
    status: PartnerStatus;
    rejectionReason?: string;
  };
}

interface PartyRef {
  _id?: string;
  name?: string;
  phone?: string;
}

export interface PartnerOrderItem {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  subtotal: number;
  totalAmount: number;
  buyerId?: PartyRef | string;
  supplierId?: PartyRef | string;
  createdAt: string;
}

export interface PartnerDisputeItem {
  _id: string;
  orderId?: { _id?: string; orderNumber?: string; totalAmount?: number; status?: string } | string;
  buyerId?: PartyRef | string;
  supplierId?: PartyRef | string;
  issueType: string;
  description: string;
  status: string;
  resolutionMethod?: string;
  reopenCount?: number;
  createdAt: string;
  resolvedAt?: string;
  /** Which side of the deal this partner introduced. */
  mySide: 'buyer' | 'supplier' | 'both';
}

export interface PartnerSupportIssue {
  _id: string;
  ticketId?: string;
  userId?: { _id?: string; name?: string; phone?: string; email?: string; role?: string } | string;
  buyerName: string;
  buyerEmail?: string;
  phone?: string;
  subject: string;
  issueType: string;
  message: string;
  priority: string;
  status: string;
  replies?: Array<{ sender: string; message: string; createdAt: string }>;
  createdAt: string;
}

export interface PartnerConcessionRequestItem {
  _id: string;
  supplierId?: { _id?: string; businessName?: string; tier?: string } | string;
  requestedBy?: { _id?: string; name?: string; role?: string } | string;
  source: 'sales' | 'supplier' | 'partner';
  type: string;
  proposal: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decisionNote?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface PartnerConcessionEligibleSupplier {
  _id: string;
  businessName?: string;
  tier?: string;
  kycStatus?: string;
  subscription?: { status?: string; tier?: string; expiryDate?: string };
  listingFeeOverride?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminPartnerOverview {
  active: number;
  pending: number;
  suspended: number;
  rejected: number;
  nonPending?: number;
  totalWithdrawable: number;
  totalLifetimeCommission: number;
}

export interface AdminPartnerDetail {
  success: boolean;
  partner: PartnerProfile;
  referrals: {
    buyers: Array<Omit<PartnerReferredBuyer, 'orders' | 'volume'>>;
    suppliers: Array<Omit<PartnerReferredSupplier, 'orders' | 'volume'>>;
    totalBuyers: number;
    totalSuppliers: number;
  };
  commissions: PartnerCommissionItem[];
  commissionSummary: PartnerCommissionSummary;
  payouts: PartnerPayoutItem[];
  payoutSummary: {
    requested: number;
    processing: number;
    completed: number;
    rejected: number;
    completedNet: number;
  };
  activity: {
    disputeCount: number;
    ticketCount: number;
    referredOrders: number;
    referredVolume: number;
  };
}

export const partnerService = {
  // ── Partner self-service ──
  async getProfile(): Promise<PartnerProfile> {
    const res = await apiClient.get('/partner/profile');
    return res.data.partner;
  },

  async updateProfile(payload: {
    fullName?: string;
    businessName?: string;
    panNumber?: string;
    gstin?: string;
    city?: string;
    state?: string;
    bankDetails?: PartnerBankDetails;
  }): Promise<PartnerProfile> {
    const res = await apiClient.put('/partner/profile', payload);
    return res.data.partner;
  },

  async getDashboard(): Promise<PartnerDashboardData> {
    const res = await apiClient.get('/partner/dashboard');
    return res.data;
  },

  async getReferrals(): Promise<PartnerReferrals> {
    const res = await apiClient.get('/partner/referrals');
    return res.data.referrals;
  },

  async getCommissions(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/partner/commissions', { params });
    return res.data as {
      commissions: PartnerCommissionItem[];
      summary: PartnerCommissionSummary;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/partner/orders', { params });
    return res.data as {
      orders: PartnerOrderItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async getDisputes(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/partner/disputes', { params });
    return res.data as {
      disputes: PartnerDisputeItem[];
      summary: { open: number; resolved: number; total: number };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async getSupportIssues(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/partner/issues', { params });
    return res.data as {
      issues: PartnerSupportIssue[];
      summary: { open: number; pending: number; resolved: number; closed: number; total: number };
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async raiseSupportIssue(payload: {
    customerUserId?: string;
    subject: string;
    message: string;
    issueType?: string;
    priority?: 'Low' | 'Medium' | 'High';
  }) {
    const res = await apiClient.post('/partner/issues', payload);
    return res.data as { success: boolean; message: string; ticket: PartnerSupportIssue };
  },

  async getConcessions(params?: { status?: string }) {
    const res = await apiClient.get('/partner/concessions', { params });
    return res.data as {
      requests: PartnerConcessionRequestItem[];
      eligibleSuppliers: PartnerConcessionEligibleSupplier[];
    };
  },

  async recommendConcession(payload: {
    supplierId: string;
    type: string;
    proposal: Record<string, unknown>;
    reason: string;
    criteriaComment?: string;
    documentUrl?: string;
  }) {
    const res = await apiClient.post('/partner/concessions', payload);
    return res.data as { success: boolean; message: string; request: PartnerConcessionRequestItem };
  },

  async requestPayout(amount: number) {
    const res = await apiClient.post('/partner/payouts', { amount });
    return res.data as { success: boolean; message: string; payout: PartnerPayoutItem; wallet: PartnerWallet };
  },

  async getPayouts(): Promise<PartnerPayoutItem[]> {
    const res = await apiClient.get('/partner/payouts');
    return res.data.payouts as PartnerPayoutItem[];
  },

  // ── Admin management ──
  async adminGetAllPartners(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const res = await apiClient.get('/admin/partners', { params });
    return res.data as {
      partners: PartnerProfile[];
      pendingCount: number;
      nonPendingCount?: number;
      overview: AdminPartnerOverview;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async adminGetPartnerDetail(id: string): Promise<AdminPartnerDetail> {
    const res = await apiClient.get(`/admin/partners/${id}`);
    return res.data;
  },

  async adminCreatePartner(payload: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    commissionSharePercent?: number;
    sellerCommissionPercent?: number;
    buyerCommissionPercent?: number;
    businessName?: string;
    panNumber?: string;
    gstin?: string;
    city?: string;
    state?: string;
  }) {
    const res = await apiClient.post('/admin/partners', payload);
    return res.data;
  },

  async adminApprovePartner(
    id: string,
    payload?: {
      commissionSharePercent?: number;
      sellerCommissionPercent?: number;
      buyerCommissionPercent?: number;
      adminNotes?: string;
    }
  ) {
    const res = await apiClient.post(`/admin/partners/${id}/approve`, payload || {});
    return res.data;
  },

  async adminRejectPartner(id: string, rejectionReason: string) {
    const res = await apiClient.post(`/admin/partners/${id}/reject`, { rejectionReason });
    return res.data;
  },

  async adminUpdatePartnerStatus(id: string, status: string, rejectionReason?: string) {
    const res = await apiClient.patch(`/admin/partners/${id}/status`, {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    });
    return res.data;
  },

  async adminUpdatePartnerCommission(
    id: string,
    payload:
      | {
          commissionSharePercent?: number;
          sellerCommissionPercent?: number;
          buyerCommissionPercent?: number;
        }
      | number
  ) {
    const body = typeof payload === 'number' ? { commissionSharePercent: payload } : payload;
    const res = await apiClient.patch(`/admin/partners/${id}/commission`, body);
    return res.data;
  },

  async adminGetAllPayouts(params?: { page?: number; limit?: number; status?: string }) {
    const res = await apiClient.get('/admin/partner-payouts', { params });
    return res.data as {
      payouts: PartnerPayoutItem[];
      requestedCount: number;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async adminProcessPayout(
    id: string,
    payload: { action: 'approve' | 'reject'; paymentReference?: string; rejectionReason?: string }
  ) {
    const res = await apiClient.patch(`/admin/partner-payouts/${id}`, payload);
    return res.data;
  },
};

export default partnerService;
