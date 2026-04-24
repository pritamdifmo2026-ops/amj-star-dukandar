import apiClient from '@/api/client';
import type { 
  SendOtpPayload, 
  VerifyOtpPayload, 
  SelectRolePayload, 
  AuthResponse 
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
  }
};

export default authService;
