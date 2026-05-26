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
  autoLiveProducts?: boolean;
  businessDetails?: {
    ownerName?: string;
    email?: string;
    gstin?: string;
    pan?: string;
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
    panDocument?: string;
    gstinDocument?: string;
    annualTurnover?: number;
    monthlyProductionCapacity?: number;
    taxFilingMethod?: string;
    taxFilingDetails?: string;
    taxPaymentsCompliance?: string;
  };
  banks?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    isPrimary: boolean;
  }[];
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
  pinCode?: string;
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
  _id?: string;
  id?: string;
  name: string;
  basePrice: number;
  category: string;
  subcategory?: string;
  images: string[];
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  unit?: string;
  moq?: number;
  stock?: number;
  brand?: string;
  hsnCode?: string;
  description?: string;
  leadTime?: string;
  packagingType?: string;
  packagingSize?: string;
  packagingDimensions?: string;
  packagingWeight?: string;
  countryOfOrigin?: string;
  gstIncluded?: boolean;
  gstRate?: number;
  keywords?: string[];
  specifications?: Record<string, string>;
  supplierId?: { _id?: string; businessName: string; phone?: string };
  certificationDocs?: {
    name: string;
    documentUrl: string;
    verified: boolean;
    mandatory: boolean;
    certificationTypeId?: string;
  }[];
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
}

export interface SubAdmin {
  _id: string;
  email: string;
  name?: string;
  adminRoleLabel?: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
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

export interface RequiredCertification {
  certificationTypeId?: string;
  name: string;
  mandatory: boolean;
  description: string;
}

export interface Category {
  _id: string;
  name: string;
  image?: string;
  subcategories: Subcategory[];
  requiredCertifications: RequiredCertification[];
}

export interface CertificationType {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

export interface Enquiry {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  userRole?: 'buyer' | 'supplier' | 'reseller';
  createdAt: string;
}

export type VerifyEntityType = 'supplier' | 'reseller';
export type MessageModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
};
