import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/auth.api';
import { setCredentials } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import { parseApiError } from '@/shared/utils/errorHandler';
import type { RegisterPayload } from '../types';

export function useRegister() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success('Account created successfully!');
      navigate(ROUTES.HOME);
    },
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error(message);
    },
  });
}
