// Global ambient types for the project

export {};

declare global {
  interface Window {
    __APP_VERSION__: string;
  }
}

export type ID = string | number;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SelectOption {
  label: string;
  value: string | number;
}
