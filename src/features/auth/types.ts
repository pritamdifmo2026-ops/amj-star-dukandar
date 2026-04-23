export type UserRole = 'buyer' | 'supplier' | 'reseller' | 'admin';

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface SelectRolePayload {
  role: UserRole;
  token: string;
}

export interface AuthResponse {
  token: string;
  isNewUser: boolean;
  role?: UserRole;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
}
