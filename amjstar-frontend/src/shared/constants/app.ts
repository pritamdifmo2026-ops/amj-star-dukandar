import appConfig from '@/config/app.config';

export const APP_NAME = appConfig.appName;
export const APP_TAGLINE = appConfig.appTagline;
export const CURRENCY_SYMBOL = appConfig.currencySymbol;
export const DEFAULT_PAGE_SIZE = appConfig.defaultPageSize;
export const GST_RATE = appConfig.gstRate;

export const QUERY_KEYS = {
  PRODUCTS: 'products',
  PRODUCT: 'product',
  ORDERS: 'orders',
  ORDER: 'order',
  CART: 'cart',
  AUTH_ME: 'auth-me',
} as const;
