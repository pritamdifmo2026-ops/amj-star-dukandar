import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export function parseApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    return {
      message: data?.message || error.message || 'Something went wrong',
      statusCode: error.response?.status,
      errors: data?.errors,
    };
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
}

export function getFieldError(errors: Record<string, string[]> | undefined, field: string): string {
  return errors?.[field]?.[0] ?? '';
}
