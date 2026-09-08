export interface AdminStats {
  totalUsers: number;
  totalSuppliers: number;
  totalResellers: number;
  pendingVerifications: number;
  pendingResellers: number;
  pendingProducts: number;
  activeUsers: number;
  totalProducts: number;
  monthlySignups: { month: string; users: number }[];
  totalOrders: number;
  totalGMV: number;
  totalCommissionEarned: number;
  totalListingFeesEarned: number;
  ordersByStatus: { status: string; count: number }[];
  monthlyRevenue: { month: string; gmv: number; commission: number }[];
}

export interface AdminSupplier {
  _id: string;
  businessName: string;
  name?: string;
  phone: string;
  commissionRate?: number;
  assignedAdminContact?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedByAdmin: boolean;
  rejectionReason?: string;
  tier?: string;
  userId?: { _id?: string; name: string; email: string; phone: string; avatar?: string };
  autoLiveProducts?: boolean;
  subscription?: {
    status?: 'NONE' | 'ACTIVE' | 'EXPIRED';
    tier?: string;
    price?: number;
    gstAmount?: number;
    amountPaid?: number;
    startDate?: string;
    expiryDate?: string;
  };
  pendingUpgrade?: {
    status?: 'NONE' | 'PAYMENT_PENDING' | 'VERIFICATION_PENDING';
    targetTier?: string;
    amountPaid?: number;
    requiresVerification?: boolean;
  };
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
    returnPolicyType?: 'refund' | 'replacement' | 'both' | 'custom';
    returnPolicyCustomTerms?: string;
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
  phone?: string;
  name?: string;
  adminRoleLabel?: string;
  permissions: string[];
  assignedSuppliers?: Array<{ _id: string; businessName: string; storeSlug?: string } | string>;
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

export interface AssignedSellerDetail extends AdminSupplier {
  stats: {
    products: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
    disputes: {
      total: number;
      open: number;
      resolved: number;
    };
    orders: {
      total: number;
      completed: number;
      revenue: number;
    };
  };
}

export interface AdminDispute {
  _id: string;
  orderId?: {
    _id?: string;
    orderNumber?: string;
    totalAmount?: number;
    items?: Array<{ name: string; quantity: number; price: number }>;
    status?: string;
    platformFee?: number;
    supplierId?: string;
  } | string;
  buyerId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  supplierId?: {
    _id?: string;
  } | string;
  supplierBusinessName?: string;
  issueType: string;
  description?: string;
  reason?: string;
  status: 'open' | 'validated' | 'reopened' | 'supplier_resolved' | 'exchange' | 'resolved' | 'rejected' | string;
  evidence?: Array<{ url: string; type: 'image' | 'video' }>;
  commissionAmount?: number;
  createdAt: string;
}

