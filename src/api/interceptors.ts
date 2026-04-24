import type { AxiosInstance } from 'axios';

export function attachInterceptors(client: AxiosInstance): void {
  // Request: attach token and log
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
      return config;
    },
    (error) => {
      console.error(`❌ [API Request Error]`, error);
      return Promise.reject(error);
    }
  );

  // Response: global error handling and log
  client.interceptors.response.use(
    (response) => {
      console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.error(`❌ [API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}
