import { useState, useEffect, useCallback } from 'react';
import adminService from '../services/admin.service';
import type { AdminProduct } from '../types/admin.types';

export const useSupplierProducts = (supplierId: string) => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getSupplierProducts(supplierId);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch supplier products:', error);
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    refreshProducts: fetchProducts
  };
};
