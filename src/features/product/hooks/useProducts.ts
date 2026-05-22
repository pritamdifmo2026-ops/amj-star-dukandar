import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/product.api';
import { QUERY_KEYS } from '@/shared/constants/app';
import type { ProductFilters } from '../types';

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, filters],
    queryFn: () => productApi.list(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
