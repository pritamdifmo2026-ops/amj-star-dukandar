import { useQuery } from '@tanstack/react-query';
import { productApi } from '../services/product.api';
import { QUERY_KEYS } from '@/shared/constants/app';

export function useProduct(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PRODUCT, id],
    queryFn: () => productApi.detail(id),
    enabled: !!id,
  });
}
