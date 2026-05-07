export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  RESELLER: 'reseller',
  BUYER: 'buyer',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
