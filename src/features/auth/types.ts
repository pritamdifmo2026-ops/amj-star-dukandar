// Auth feature types

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'reseller' | 'supplier';
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supplier' | 'reseller';
  phone?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}
