import type { AxiosInstance } from 'axios';

export function attachInterceptors(client: AxiosInstance): void {
  // Request: attach token and log
  client.interceptors.request.use(
    (config) => {
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
      
      // Redirect to the appropriate login page on 401, avoiding infinite loops
      if (error.response?.status === 401) {
        const pathname = window.location.pathname;
        const isAdminPath = pathname.startsWith('/admin');
        const alreadyOnLogin = isAdminPath
          ? pathname.includes('/admin/login')
          : pathname.includes('/login');
        if (!alreadyOnLogin) {
          window.location.href = isAdminPath ? '/admin/login' : '/login';
        }
      }
      return Promise.reject(error);
    }
  );
}
