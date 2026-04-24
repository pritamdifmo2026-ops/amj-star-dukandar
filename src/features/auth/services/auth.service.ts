import apiClient from '@/api/client';
import type { 
  SendOtpPayload, 
  VerifyOtpPayload, 
  AuthResponse,
  AuthUser
} from '../types';

const authService = {
  sendOtp: async (payload: SendOtpPayload) => {
    const response = await apiClient.post('/auth/send-otp', payload);
    return response.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', payload);
    return response.data;
  },

  adminLogin: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/admin-login', { email, password });
    return response.data;
  },

  selectRole: async (payload: { role: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/select-role', payload);
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  updateProfile: async (payload: { name?: string; email?: string; phone?: string }) => {
    const response = await apiClient.put<{ message: string; user: AuthUser }>('/user/profile', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get<{ user: AuthUser }>('/user/me');
    return response.data;
  },

  sendVerificationEmail: async () => {
    const response = await apiClient.post<{ message: string }>('/user/send-verification-email', {});
    return response.data;
  },

  verifyEmail: async (emailToken: string) => {
    const response = await apiClient.get<{ message: string; user: AuthUser }>(`/user/verify-email?token=${emailToken}`);
    return response.data;
  }
};

export default authService;
