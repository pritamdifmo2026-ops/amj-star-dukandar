// Product feature types

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  minOrderQty: number;
  stock: number;
  category: string;
  imageUrl?: string;
  images: string[];
  supplierId: string;
  supplierName: string;
  isVerified: boolean;
  rating: number;
  gstRate: number;
  gstIncluded: boolean;
  hsnCode?: string;
  brand?: string;
  keywords?: string[];
  leadTime?: string;
  packagingType?: string;
  countryOfOrigin?: string;
  certifications?: string[];
  specifications?: Record<string, string>;
  supplierCity?: string;
  supplierState?: string;
  supplierAbout?: string;
  supplierYearEst?: string;
  isGSTVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  unit: string;
  minOrderQty: number;
  stock: number;
  category: string;
  categoryId?: string;
  subcategoryId?: string;
  gstRate: number;
  images: string[];
}
