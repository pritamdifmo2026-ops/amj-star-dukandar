export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER: 'supplier',
  RESELLER: 'reseller',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
