import axios from 'axios';
import env from '@/config/env';
import { attachInterceptors } from './interceptors';

const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachInterceptors(apiClient);

export default apiClient;
