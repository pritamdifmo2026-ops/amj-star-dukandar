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
