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
  token: string | null;
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
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    

  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
