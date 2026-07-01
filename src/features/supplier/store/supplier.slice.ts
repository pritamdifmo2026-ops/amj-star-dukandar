import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const SupplierTier = {
  VERIFIED: 'VERIFIED',
  GAMMA: 'GAMMA',
  BETA: 'BETA'
} as const;
export type SupplierTier = (typeof SupplierTier)[keyof typeof SupplierTier];

export const KYCStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
} as const;
export type KYCStatus = (typeof KYCStatus)[keyof typeof KYCStatus];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED'
} as const;
export type OnboardingStatus = (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const SubscriptionStatus = {
  NONE: 'NONE',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED'
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface Subscription {
  status: SubscriptionStatus;
  tier?: SupplierTier;
  price?: number;
  gstAmount?: number;
  amountPaid?: number;
  startDate?: string;
  expiryDate?: string;
}

export const UpgradeStatus = {
  NONE: 'NONE',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  VERIFICATION_PENDING: 'VERIFICATION_PENDING'
} as const;
export type UpgradeStatus = (typeof UpgradeStatus)[keyof typeof UpgradeStatus];

export interface PendingUpgrade {
  status: UpgradeStatus;
  targetTier?: SupplierTier;
  price?: number;
  gstAmount?: number;
  amountPaid?: number;
  requiresVerification?: boolean;
  requestedAt?: string;
  paidAt?: string;
}

interface SupplierProfile {
  _id?: string;
  businessName: string;
  phone: string;
  tier: SupplierTier;
  kycStatus: KYCStatus;
  onboardingStatus: OnboardingStatus;
  isActive: boolean;
  rejectionReason?: string;
  usesOwnShipping?: boolean;
  verifiedByAdmin?: boolean;
  subscription?: Subscription;
  pendingUpgrade?: PendingUpgrade;
  maxProducts?: number;
}

interface SupplierState {
  profile: SupplierProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  profile: null,
  loading: false,
  error: null,
};

const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {
    setSupplierProfile(state, action: PayloadAction<SupplierProfile>) {
      state.profile = action.payload;
    },
    updateOnboardingProgress(state, action: PayloadAction<Partial<SupplierProfile>>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    clearSupplierProfile(state) {
      state.profile = null;
    }
  },
});

export const { setSupplierProfile, updateOnboardingProgress, clearSupplierProfile } = supplierSlice.actions;
export default supplierSlice.reducer;
