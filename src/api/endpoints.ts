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
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    DETAIL: (id: string | number) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE_STATUS: (id: string | number) => `/orders/${id}/status`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    REMOVE: (id: string | number) => `/cart/${id}`,
    CLEAR: '/cart/clear',
  },
} as const;
