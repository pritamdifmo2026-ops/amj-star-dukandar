import apiClient from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { Order, CreateOrderPayload } from '../types';
import type { PaginatedResponse } from '@/shared/types/global.d';

export const orderApi = {
  list: async (): Promise<PaginatedResponse<Order>> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.LIST);
    return res.data;
  },

  supplierOrders: async (): Promise<{ data: any[]; stats: any }> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.SUPPLIER_LIST);
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

  dispatch: async (
    id: string,
    payload?: { courierName?: string; trackingNumber?: string; trackingURL?: string }
  ): Promise<{ trackingId: string; dispatchedAt: string; courierName: string; isOwnShipping: boolean }> => {
    const res = await apiClient.patch(ENDPOINTS.ORDERS.DISPATCH(id), payload || {});
    return res.data.data;
  },

  markDelivered: async (id: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.MARK_DELIVERED(id));
  },

  confirmDelivery: async (
    id: string,
    payload: {
      condition: 'good' | 'issue';
      disputeType?: string;
      disputeDescription?: string;
      rating?: number;
      dimensions?: { quality?: number; packaging?: number; communication?: number; onTime?: number };
      comment?: string;
    }
  ): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.CONFIRM_DELIVERY(id), payload);
  },

  submitReview: async (
    id: string,
    payload: {
      rating: number;
      dimensions?: { quality?: number; packaging?: number; communication?: number; onTime?: number };
      comment?: string;
    }
  ): Promise<void> => {
    await apiClient.post(ENDPOINTS.ORDERS.REVIEW(id), payload);
  },
};
