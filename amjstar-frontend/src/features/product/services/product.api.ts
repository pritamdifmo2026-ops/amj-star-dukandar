import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Product, ProductFilters, CreateProductPayload } from '../types';
import type { PaginatedResponse } from '@/shared/types/global.d';

const mapProduct = (item: any): Product => ({
  id: item._id,
  name: item.name,
  description: item.description,
  price: item.basePrice || 0,
  unit: item.unit || 'Piece',
  minOrderQty: item.moq || 1,
  stock: item.stock || 0,
  category: item.category || 'Other',
  imageUrl: item.images?.[0],
  images: item.images || [],
  supplierId: item.supplierId?._id || item.supplierId,
  supplierName: item.supplierId?.businessName || 'Verified Supplier',
  isVerified: item.supplierId?.verifiedByAdmin ?? true,
  rating: item.rating || 5,
  gstRate: item.gstRate || 18,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

export const productApi = {
  list: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {

    const res = await apiClient.get(ENDPOINTS.PRODUCTS.LIST, { params: filters });
    
    const rawProducts = res.data.products || [];
    
    return {
      data: rawProducts.map(mapProduct),
      total: rawProducts.length,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 10,
      totalPages: 1
    };
  },

  detail: async (id: string): Promise<Product> => {
    const res = await apiClient.get(ENDPOINTS.PRODUCTS.DETAIL(id));
    return mapProduct(res.data.product);
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
