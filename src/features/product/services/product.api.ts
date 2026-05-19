import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Product, ProductFilters, CreateProductPayload } from '../types';
import type { PaginatedResponse } from '@/shared/types/global.d';

const mapProduct = (item: any): Product => {
  // Extremely robust ID extraction
  const rawId = item.id || item._id || item.productId || (item as any)._id || (item as any).id;
  const finalId = (rawId && rawId !== 'undefined') ? String(rawId) : '';
  
  return {
    id: finalId,
    name: item.name || 'Unknown Product',
    description: item.description || '',
    price: item.basePrice || item.price || 0,
    unit: item.unit || 'Piece',
    minOrderQty: item.moq || item.minOrderQty || 1,
    stock: item.stock || 0,
    category: item.category || 'Other',
    imageUrl: item.images?.[0] || item.imageUrl,
    images: item.images || [],
    supplierId: item.supplierId?.id || item.supplierId?._id || item.supplierId,
    supplierName: item.supplierId?.businessName || item.supplierName || 'Verified Supplier',
    isVerified: item.supplierId?.verifiedByAdmin ?? item.isVerified ?? true,
    rating: item.rating || 5,
    gstRate: item.gstRate ?? 18,
    gstIncluded: item.gstIncluded ?? false,
    hsnCode: item.hsnCode,
    brand: item.brand,
    keywords: item.keywords,
    leadTime: item.leadTime,
    packagingType: item.packagingType,
    countryOfOrigin: item.countryOfOrigin,
    certifications: item.certifications,
    specifications: item.specifications,
    supplierCity: item.supplierId?.businessDetails?.city,
    supplierState: item.supplierId?.businessDetails?.state,
    supplierAbout: item.supplierId?.businessDetails?.about,
    supplierYearEst: item.supplierId?.businessDetails?.yearOfEstablishment,
    isGSTVerified: !!(item.supplierId?.businessDetails?.gstin),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    supplierDetails: item.supplierId && typeof item.supplierId === 'object' ? {
      businessName: item.supplierId.businessName,
      gstin: item.supplierId.businessDetails?.gstin || item.supplierId.businessDetails?.gstNumber,
      address: item.supplierId.businessDetails?.address,
      city: item.supplierId.businessDetails?.city,
      state: item.supplierId.businessDetails?.state,
      pinCode: item.supplierId.businessDetails?.pinCode || item.supplierId.businessDetails?.pincode,
      ownerName: item.supplierId.businessDetails?.ownerName,
    } : undefined
  };
};

export const productApi = {
  list: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const res = await apiClient.get(ENDPOINTS.PRODUCTS.LIST, { params: filters });
    
    // Support both { products: [] } and raw [] responses
    const productsData = res.data?.products || (Array.isArray(res.data) ? res.data : []);
    const rawProducts = Array.isArray(productsData) ? productsData : [];
    
    const mappedProducts = rawProducts.map(mapProduct).filter(p => p.id && p.id !== 'undefined');
    
    return {
      data: mappedProducts,
      total: mappedProducts.length,
      page: filters?.page || 1,
      pageSize: filters?.pageSize || 10,
      totalPages: 1
    };
  },

  detail: async (id: string): Promise<Product> => {
    if (!id || id === 'undefined') {
      throw new Error('Invalid product ID');
    }
    const res = await apiClient.get(ENDPOINTS.PRODUCTS.DETAIL(id));
    const product = mapProduct(res.data.product || res.data);
    if (!product.id || product.id === 'undefined') {
      throw new Error('Product not found or invalid');
    }
    return product;
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

  getSuggestions: async (q: string, category?: string): Promise<any[]> => {
    const res = await apiClient.get(ENDPOINTS.PRODUCTS.SUGGESTIONS, { 
      params: { q, category: category === 'All' ? undefined : category } 
    });
    return res.data.suggestions || [];
  },
};
