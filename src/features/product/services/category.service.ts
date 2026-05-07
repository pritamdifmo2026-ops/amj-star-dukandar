import apiClient from '@/api/client';

export const categoryService = {
  getAll: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Admin only
  create: async (name: string, image?: string, subcategories?: string[]) => {
    const response = await apiClient.post('/categories', { name, image, subcategories });
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },
  
  createSubcategory: async (categoryId: string, name: string) => {
    const response = await apiClient.post(`/categories/${categoryId}/subcategories`, { name });
    return response.data;
  },
  
  updateSubcategory: async (subId: string, data: any) => {
    const response = await apiClient.patch(`/categories/subcategories/${subId}`, data);
    return response.data;
  },

  deleteSubcategory: async (subId: string) => {
    const response = await apiClient.delete(`/categories/subcategories/${subId}`);
    return response.data;
  }
};

export default categoryService;
