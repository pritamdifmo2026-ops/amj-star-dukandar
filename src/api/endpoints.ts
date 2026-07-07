export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string | number) => `/products/${id}`,
    DELETE: (id: string | number) => `/products/${id}`,
    SUGGESTIONS: '/products/suggestions',
    SELLER_TOGGLE: (id: string | number) => `/products/${id}/seller-toggle`,
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    SUPPLIER_LIST: '/orders/supplier',
    SUPPLIER_ACTIVE_COUNT: '/orders/supplier/active-count',
    DETAIL: (id: string | number) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string | number) => `/orders/${id}/status`,
    DISPATCH: (id: string | number) => `/orders/${id}/dispatch`,
    PACK: (id: string | number) => `/orders/${id}/pack`,
    CONFIRM_DELIVERY: (id: string | number) => `/orders/${id}/confirm-delivery`,
    MARK_DELIVERED: (id: string | number) => `/orders/${id}/mark-delivered`,
    REVIEW: (id: string | number) => `/orders/${id}/review`,
    PO_DOWNLOAD: (id: string | number) => `/orders/${id}/po-download`,
    // Disputes
    RAISE_DISPUTE: (id: string | number) => `/orders/${id}/dispute`,
    GET_DISPUTE: (orderId: string | number) => `/orders/${orderId}/dispute`,
    DISPUTE_SUPPLIER_RESOLVE: (id: string | number) => `/orders/disputes/${id}/supplier-resolve`,
    DISPUTE_BUYER_CONFIRM: (id: string | number) => `/orders/disputes/${id}/buyer-confirm`,
    DISPUTE_REOPEN: (id: string | number) => `/orders/disputes/${id}/reopen`,
    // Replacement exchange sub-flow
    EXCHANGE_RETURN_SHIPMENT: (id: string | number) => `/orders/disputes/${id}/return-shipment`,
    EXCHANGE_PICKUP_TRACKING: (id: string | number) => `/orders/disputes/${id}/pickup-tracking`,
    EXCHANGE_CONFIRM_HANDOVER: (id: string | number) => `/orders/disputes/${id}/confirm-handover`,
    EXCHANGE_RETURN_RECEIVED: (id: string | number) => `/orders/disputes/${id}/return-received`,
    EXCHANGE_DISPATCH_REPLACEMENT: (id: string | number) => `/orders/disputes/${id}/dispatch-replacement`,
    EXCHANGE_CONFIRM: (id: string | number) => `/orders/disputes/${id}/confirm-exchange`,
    EXCHANGE_REPORT: (id: string | number) => `/orders/disputes/${id}/report-replacement`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    REMOVE: (id: string | number) => `/cart/${id}`,
    CLEAR: '/cart/clear',
  },

  // Chat
  CHAT: {
    CONVERSATION: '/chat/conversation',
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: (id: string) => `/chat/messages/${id}`,
    UNREAD_COUNT: '/chat/unread-count',
  },
} as const;
