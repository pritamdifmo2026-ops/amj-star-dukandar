export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  RESELLER: 'reseller',
  BUYER: 'buyer',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
