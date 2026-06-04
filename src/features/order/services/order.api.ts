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

  // ── Packed (supplier, optional pre-dispatch step) ──
  markPacked: async (id: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.PACK(id));
  },

  // ── Disputes (Flow A) ──
  raiseDispute: async (
    id: string,
    payload: {
      issueType: string;
      description: string;
      evidence: { url: string; type: 'image' | 'video' }[];
    }
  ): Promise<void> => {
    await apiClient.post(ENDPOINTS.ORDERS.RAISE_DISPUTE(id), payload);
  },

  getDispute: async (orderId: string): Promise<any | null> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.GET_DISPUTE(orderId));
    return res.data.dispute;
  },

  supplierResolveDispute: async (
    disputeId: string,
    resolutionMethod: 'refund' | 'replacement' | 'partial' | 'other',
    resolutionNote: string,
    requiresReturn?: boolean,
    refundTransactionId?: string,
  ): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.DISPUTE_SUPPLIER_RESOLVE(disputeId), { resolutionMethod, resolutionNote, requiresReturn, refundTransactionId });
  },

  // ── Replacement exchange sub-flow ──
  submitReturnShipment: async (disputeId: string, courier: string, tracking: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_RETURN_SHIPMENT(disputeId), { courier, tracking });
  },
  markReturnReceived: async (disputeId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_RETURN_RECEIVED(disputeId));
  },
  dispatchReplacement: async (disputeId: string, courier: string, tracking: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_DISPATCH_REPLACEMENT(disputeId), { courier, tracking });
  },
  confirmExchangeDone: async (disputeId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_CONFIRM(disputeId));
  },
  reportReplacementIssue: async (disputeId: string, reason: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_REPORT(disputeId), { reason });
  },

  buyerConfirmResolved: async (disputeId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.DISPUTE_BUYER_CONFIRM(disputeId));
  },

  buyerReopenDispute: async (disputeId: string, reason: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.DISPUTE_REOPEN(disputeId), { reason });
  },
};
