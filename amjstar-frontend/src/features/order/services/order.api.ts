import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Order, CreateOrderPayload } from '../types';
import type { PaginatedResponse } from '@/shared/types/global.d';

export const orderApi = {
  list: async (): Promise<PaginatedResponse<Order>> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.LIST);
    return res.data;
  },

  detail: async (id: string): Promise<Order> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.DETAIL(id));
    return res.data;
  },

  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await apiClient.post(ENDPOINTS.ORDERS.CREATE, payload);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const res = await apiClient.patch(ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status });
    return res.data;
  },
};
