import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ResellerProfile } from '@/features/reseller/services/reseller.service';

interface ResellerState {
  profile: ResellerProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ResellerState = {
  profile: null,
  loading: false,
  error: null,
};

const resellerSlice = createSlice({
  name: 'reseller',
  initialState,
  reducers: {
    setResellerProfile: (state, action: PayloadAction<ResellerProfile>) => {
      state.profile = action.payload;
    },
    setResellerLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setResellerError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearResellerProfile: (state) => {
      state.profile = null;
    }
  },
});

export const { 
  setResellerProfile, 
  setResellerLoading, 
  setResellerError, 
  clearResellerProfile 
} = resellerSlice.actions;

export default resellerSlice.reducer;
