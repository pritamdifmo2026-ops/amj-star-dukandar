import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Product, ProductFilters, CreateProductPayload } from '../types';
import type { PaginatedResponse } from '@/shared/types/global.d';
import { MOCK_PRODUCTS } from '@/api/mocks/products';

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Set this to true to force mocks and avoid red console errors
const USE_MOCKS = true; 

export const productApi = {
  list: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    if (USE_MOCKS) {
      console.log('Serving from Mocks...');
      await delay(500);
      let filtered = [...MOCK_PRODUCTS];
      
      if (filters?.category) {
        filtered = filtered.filter(p => p.category === filters.category);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }

      return {
        data: filtered,
        total: filtered.length,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
        totalPages: 1
      };
    }

    const res = await apiClient.get(ENDPOINTS.PRODUCTS.LIST, { params: filters });
    return res.data;
  },

  detail: async (id: string): Promise<Product> => {
    if (USE_MOCKS) {
      await delay(300);
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return product;
    }

    const res = await apiClient.get(ENDPOINTS.PRODUCTS.DETAIL(id));
    return res.data;
  },

  create: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await apiClient.post(ENDPOINTS.PRODUCTS.CREATE, payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
    const res = await apiClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), payload);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.PRODUCTS.DELETE(id));
  },
};
