import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { LoginPayload, RegisterPayload, AuthResponse } from '../types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.REGISTER, payload);
    return res.data;
  },

  sendOtp: async (phone: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, { phone });
  },

  verifyOtp: async (phone: string, otp: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.VERIFY_OTP, { phone, otp });
    return res.data;
  },

  sendRegisterOtp: async (type: 'email' | 'phone', identifier: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.SEND_REGISTER_OTP, { type, identifier });
  },

  verifyRegisterOtp: async (type: 'email' | 'phone', identifier: string, otp: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.VERIFY_REGISTER_OTP, { type, identifier, otp });
  },

  sendForgotPasswordOtp: async (identifier: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_SEND_OTP, { identifier });
  },

  verifyForgotPasswordOtp: async (payload: { identifier: string; otp: string }): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP, payload);
  },

  resetPassword: async (payload: { identifier: string; otp: string; newPassword: string }): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, payload);
  },

  me: async (): Promise<AuthResponse['user']> => {
    const res = await apiClient.get(ENDPOINTS.AUTH.ME);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  },
};
