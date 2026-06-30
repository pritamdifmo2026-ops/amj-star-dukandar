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
