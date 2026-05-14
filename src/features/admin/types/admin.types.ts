export interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalResellers: number;
  pendingVerifications: number;
  pendingResellers: number;
  pendingProducts: number;
  activeUsers: number;
  totalProducts?: number;
}

export interface AdminSupplier {
  _id: string;
  businessName: string;
  phone: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedByAdmin: boolean;
  rejectionReason?: string;
  tier?: string;
  userId?: { name: string; email: string; phone: string };
  businessDetails?: {
    ownerName?: string;
    email?: string;
    gstin?: string;
    yearOfEstablishment?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    about?: string;
    isFoodSupplier?: boolean;
    fssaiLicenseNumber?: string;
    fssaiCertificate?: string;
    isWomenEntrepreneur?: boolean;
  };
}

export interface AdminReseller {
  _id: string;
  storeName: string;
  fullName: string;
  phone?: string;
  email?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  profileType?: string;
  experience?: string;
  reach?: string;
  monthlyVolume?: string;
  subscriptionPlan?: string;
  soldBefore?: boolean;
  profileDescription?: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  gstNumber?: string;
  panNumber?: string;
  idProofUrl?: string;
  platforms?: string[];
  user?: { name: string; email: string; phone: string };
}

export interface AdminProduct {
  _id: string;
  name: string;
  basePrice: number;
  category: string;
  images: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  unit?: string;
  supplierId?: { businessName: string };
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

export interface Banner {
  _id: string;
  imageDesktop: string;
  imageTablet: string;
  imageMobile: string;
  link: string;
  status: boolean;
  order: number;
}

export interface Subcategory {
  _id: string;
  name: string;
}

export interface Category {
  _id: string;
  name: string;
  image?: string;
  subcategories: Subcategory[];
}

export type VerifyEntityType = 'supplier' | 'reseller';
export type MessageModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
};
