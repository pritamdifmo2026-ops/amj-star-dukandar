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

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'reseller' | 'supplier';
}

export interface AuthResponse {
  token: string;
  isNewUser?: boolean;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

