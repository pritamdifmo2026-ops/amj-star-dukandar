import apiClient from '@/api/client';
import type { 
  SendOtpPayload, 
  VerifyOtpPayload, 
  SelectRolePayload, 
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

  selectRole: async (payload: SelectRolePayload) => {
    const response = await apiClient.post<AuthResponse>('/auth/select-role', payload, {
      headers: {
        Authorization: `Bearer ${payload.token}`
      }
    });
    return response.data;
  },

  updateProfile: async (payload: { name?: string; email?: string; phone?: string; token: string }) => {
    const response = await apiClient.put<{ message: string; user: AuthUser }>('/auth/profile', payload, {
      headers: {
        Authorization: `Bearer ${payload.token}`
      }
    });
    return response.data;
  },

  getMe: async (token: string) => {
    const response = await apiClient.get<{ user: AuthUser }>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  sendVerificationEmail: async (token: string) => {
    const response = await apiClient.post<{ message: string }>('/auth/send-verification-email', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  verifyEmail: async (emailToken: string) => {
    const response = await apiClient.get<{ message: string; user: AuthUser }>(`/auth/verify-email?token=${emailToken}`);
    return response.data;
  }
};

export default authService;
