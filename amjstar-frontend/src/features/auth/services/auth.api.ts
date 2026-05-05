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

  me: async (): Promise<AuthResponse['user']> => {
    const res = await apiClient.get(ENDPOINTS.AUTH.ME);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
  },
};
