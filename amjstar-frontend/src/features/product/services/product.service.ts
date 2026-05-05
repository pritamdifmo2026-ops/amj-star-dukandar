import apiClient from '@/api/client';

export interface ProductInput {
  name: string;
  description: string;
  basePrice: number;
  moq: number;
  unit: string;
  category: string;
  hsnCode: string;
  images?: string[];
  specifications?: Record<string, string>;
}

export const productService = {
  createProduct: async (data: ProductInput) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  getMyProducts: async () => {
    const response = await apiClient.get('/products/my-products');
    return response.data;
  },

  getPublicProducts: async (category?: string) => {
    const response = await apiClient.get('/products', { 
      params: { category } 
    });
    return response.data;
  },

  // Admin
  verifyProduct: async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const response = await apiClient.patch(`/products/${id}/verify`, { status });
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<ProductInput>) => {
    const response = await apiClient.patch(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};

export default productService;
