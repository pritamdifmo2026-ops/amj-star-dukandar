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
};

export default supplierConcessionApi;
