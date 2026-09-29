import apiClient from '@/api/client';
import type {
  ConcessionRequest,
  CreateConcessionInput,
} from '@/features/admin/services/concession.api';

const supplierConcessionApi = {
  create: async (input: Omit<CreateConcessionInput, 'supplierId'>): Promise<ConcessionRequest> => {
    // Backend derives supplierId from the auth session for supplier callers.
    const res = await apiClient.post('/supplier/concessions', input);
    return res.data.request;
  },
  listMine: async (): Promise<ConcessionRequest[]> => {
    const res = await apiClient.get('/supplier/concessions/mine');
    return res.data.requests;
  },
  sendSalesRepOtp: async (phone: string): Promise<{ success: boolean; message: string; salesRepName?: string; devOtp?: string }> => {
    const res = await apiClient.post('/supplier/concessions/send-sales-rep-otp', { phone });
    return res.data;
  },
  verifySalesRepOtp: async (phone: string, otp: string): Promise<{ success: boolean; verified: boolean; salesRep?: { name: string; phone: string; role: string }; message?: string }> => {
    const res = await apiClient.post('/supplier/concessions/verify-sales-rep-otp', { phone, otp });
    return res.data;
  },
  verifySalesRep: async (phone: string): Promise<{ verified: boolean; salesRep?: { name: string; phone: string; role: string }; message?: string }> => {
    const res = await apiClient.post('/supplier/concessions/verify-sales-rep', { phone });
    return res.data;
  },
};

export default supplierConcessionApi;
