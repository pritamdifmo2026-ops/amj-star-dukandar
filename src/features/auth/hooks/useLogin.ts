import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/auth.api';
import { setCredentials } from '@/store/slices/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import { parseApiError } from '@/shared/utils/errorHandler';
import type { LoginPayload } from '../types';

export function useLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success(`Welcome back, ${data.user.name}!`);
      const roleRedirect: Record<string, string> = {
        admin: ROUTES.ADMIN_DASHBOARD,
        supplier: ROUTES.SUPPLIER_DASHBOARD,
        reseller: ROUTES.RESELLER_DASHBOARD,
      };
      navigate(roleRedirect[data.user.role] || ROUTES.HOME);
    },
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error(message);
    },
  });
}
