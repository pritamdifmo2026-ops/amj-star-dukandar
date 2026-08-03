import { useMutation } from '@tanstack/react-query';

import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/auth.api';
import {   } from '@/features/auth/store/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import { parseApiError } from '@/shared/utils/errorHandler';
import type { RegisterPayload } from '../types';

export function useRegister() {
  
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: () => {
      toast.success('Account created successfully! Please log in.');
      navigate(ROUTES.LOGIN);
    },
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error(message);
    },
  });
}
