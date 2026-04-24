import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '@/shared/constants/roles';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const storedUser = localStorage.getItem('user');
let initialUser = null;
try {
  if (storedUser) initialUser = JSON.parse(storedUser);
} catch (e) {
  console.error('Failed to parse stored user', e);
}

const initialState: AuthState = {
  user: initialUser,
  isAuthenticated: !!initialUser,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser }>) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
    },
    

  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
