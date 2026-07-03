import apiClient from '@/api/client';

export interface BusinessProfileData {
  gstNumber?: string;
  companyName?: string;
  companyAddress?: string;
  businessDetails?: string;
  rawMaterialEstimate?: string;
  requirementDescription?: string;
  businessCategory?: string;
}

export interface RequirementData {
  productType?: string;
  category?: string;
  subcategory?: string;
  quantityNeeded?: string;
  productSpecifications?: string;
  additionalDetails?: string;
}

export interface AccountOverviewResponse {
  businessProfile: BusinessProfileData | null;
  requirement: RequirementData | null;
}

export interface PostedRequirement {
  _id: string;
  reqId: string;
  productName: string;
  category: string;
  subcategory: string;
  quantity: string;
  notes?: string;
  buyerName: string;
  buyerCompany: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerLocation?: string;
  status: 'New' | 'In Progress' | 'Follow Up' | 'Converted' | 'Closed';
  assignedSupplierId?: {
    _id: string;
    businessName: string;
    phone?: string;
  };
  recommendedProductId?: {
    id: string;
    name: string;
    images?: string[];
    basePrice?: number;
  };
  recommendedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const buyerProfileApi = {
  getAccountOverview: async (): Promise<AccountOverviewResponse> => {
    const response = await apiClient.get('/buyer/account-overview');
    return response.data;
  },

  upsertBusinessProfile: async (data: BusinessProfileData): Promise<{ message: string; businessProfile: BusinessProfileData }> => {
    const response = await apiClient.put('/buyer/business-profile', data);
    return response.data;
  },

  upsertRequirement: async (data: RequirementData): Promise<{ message: string; requirement: RequirementData }> => {
    const response = await apiClient.put('/buyer/requirement', data);
    return response.data;
  },

  getMyRequirements: async (): Promise<PostedRequirement[]> => {
    const response = await apiClient.get('/requirements/my');
    return response.data.requirements;
  },
};

