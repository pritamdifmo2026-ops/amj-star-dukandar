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

  supplierActiveOrderCount: async (): Promise<number> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.SUPPLIER_ACTIVE_COUNT);
    return res.data.count;
  },

  detail: async (id: string): Promise<Order> => {
    const res = await apiClient.get(ENDPOINTS.ORDERS.DETAIL(id));
    return (res.data as any)?.data ?? res.data;
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
    payload?: {
      courierName?: string;
      trackingNumber?: string;
      trackingURL?: string;
      driverPhone?: string;
      vehicleNumber?: string;
      dispatchNote?: string;
    }
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

  submitBuyerReview: async (
    id: string,
    payload: {
      rating: number;
      comment?: string;
    }
  ): Promise<void> => {
    await apiClient.post(ENDPOINTS.ORDERS.RATE_BUYER(id), payload);
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
      requestedResolution?: 'refund' | 'replacement' | 'partial_replacement';
      affectedQuantity?: number;
      affectedProducts?: {
        productId?: string;
        name: string;
        quantity?: number;
        affectedQuantity?: number;
        image?: string;
      }[];
      buyerRefundDetails?: {
        accountHolderName?: string;
        bankName?: string;
        accountNumber?: string;
        ifscCode?: string;
        upiId?: string;
      };
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
    returnMode?: 'buyer_ships' | 'supplier_pickup',
  ): Promise<any> => {
    const res = await apiClient.patch(ENDPOINTS.ORDERS.DISPUTE_SUPPLIER_RESOLVE(disputeId), { resolutionMethod, resolutionNote, requiresReturn, refundTransactionId, returnMode });
    return res.data;
  },

  // ── Replacement exchange sub-flow ──
  submitReturnShipment: async (
    disputeIdOrPayload:
      | string
      | {
          disputeId: string;
          courier?: string;
          tracking?: string;
          shipmentType?: 'courier' | 'own_truck';
          vehicleNumber?: string;
          driverPhone?: string;
          trackingURL?: string;
        },
    legacyCourier?: string,
    legacyTracking?: string
  ): Promise<void> => {
    if (typeof disputeIdOrPayload === 'string') {
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_RETURN_SHIPMENT(disputeIdOrPayload), {
        courier: legacyCourier,
        tracking: legacyTracking,
      });
    } else {
      const { disputeId, ...body } = disputeIdOrPayload;
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_RETURN_SHIPMENT(disputeId), body);
    }
  },
  setPickupTracking: async (
    disputeIdOrPayload: string | {
      disputeId: string;
      shipmentType?: 'courier' | 'own_truck';
      courier?: string;
      tracking?: string;
      vehicleNumber?: string;
      driverPhone?: string;
      trackingURL?: string;
    },
    maybeCourier?: string,
    maybeTracking?: string
  ): Promise<void> => {
    if (typeof disputeIdOrPayload === 'string') {
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_PICKUP_TRACKING(disputeIdOrPayload), { courier: maybeCourier, tracking: maybeTracking });
    } else {
      const { disputeId, ...body } = disputeIdOrPayload;
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_PICKUP_TRACKING(disputeId), body);
    }
  },
  confirmHandover: async (disputeId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_CONFIRM_HANDOVER(disputeId));
  },
  markReturnReceived: async (disputeId: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_RETURN_RECEIVED(disputeId));
  },
  submitRefundAfterReturn: async (disputeId: string, refundTransactionId: string, resolutionNote?: string): Promise<void> => {
    await apiClient.patch(ENDPOINTS.ORDERS.DISPUTE_SUBMIT_REFUND(disputeId), { refundTransactionId, resolutionNote });
  },
  dispatchReplacement: async (
    disputeIdOrPayload: string | {
      disputeId: string;
      shipmentType?: 'courier' | 'own_truck';
      courier?: string;
      tracking?: string;
      vehicleNumber?: string;
      driverPhone?: string;
      trackingURL?: string;
      replacementItems?: Array<{
        name: string;
        productId?: string;
        orderedQty: number;
        affectedQty: number;
        replacementQty: number;
        unit?: string;
        image?: string;
      }>;
    },
    maybeCourier?: string,
    maybeTracking?: string
  ): Promise<void> => {
    if (typeof disputeIdOrPayload === 'string') {
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_DISPATCH_REPLACEMENT(disputeIdOrPayload), { courier: maybeCourier, tracking: maybeTracking });
    } else {
      const { disputeId, ...body } = disputeIdOrPayload;
      await apiClient.patch(ENDPOINTS.ORDERS.EXCHANGE_DISPATCH_REPLACEMENT(disputeId), body);
    }
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
