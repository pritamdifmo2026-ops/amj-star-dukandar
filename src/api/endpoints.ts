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
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    SUPPLIER_LIST: '/orders/supplier',
    DETAIL: (id: string | number) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string | number) => `/orders/${id}/status`,
    DISPATCH: (id: string | number) => `/orders/${id}/dispatch`,
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
