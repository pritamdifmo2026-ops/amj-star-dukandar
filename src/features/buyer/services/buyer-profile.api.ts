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
};
