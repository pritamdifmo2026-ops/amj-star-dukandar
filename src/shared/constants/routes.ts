export const ROUTES = {
  HOME: '/',

  // Auth
  LOGIN: '/login',
  VERIFY_OTP: '/verify-otp',
  SELECT_ROLE: '/select-role',
  REGISTER: '/register',

  // Reseller
  RESELLER_DASHBOARD: '/reseller/dashboard',
  RESELLER_ORDERS: '/reseller/orders',
  RESELLER_CART: '/reseller/cart',
  RESELLER_CHECKOUT: '/reseller/checkout',

  // Supplier
  SUPPLIER_DASHBOARD: '/supplier/dashboard',
  SUPPLIER_PRODUCTS: '/supplier/products',
  SUPPLIER_ADD_PRODUCT: '/supplier/products/add',
  SUPPLIER_ORDERS: '/supplier/orders',

  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',

  // Product
  PRODUCT_LIST: '/products',
  PRODUCT_DETAIL: '/products/:id',
} as const;
