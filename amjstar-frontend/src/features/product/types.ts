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
  imageUrl?: string; // Main image
  images: string[]; // Gallery images
  supplierId: string;
  supplierName: string;
  isVerified: boolean;
  rating: number;
  gstRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
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
  gstRate: number;
  images: string[];
}
