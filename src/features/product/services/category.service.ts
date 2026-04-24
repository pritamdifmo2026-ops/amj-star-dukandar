import apiClient from '@/api/client';

export const categoryService = {
  getAll: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Admin only
  create: async (name: string, image?: string) => {
    const response = await apiClient.post('/categories', { name, image });
    return response.data;
  }
};

export default categoryService;
