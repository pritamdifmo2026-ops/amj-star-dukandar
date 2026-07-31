import { useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/auth.api';
import { setCredentials } from '@/features/auth/store/auth.slice';
import { ROUTES } from '@/shared/constants/routes';
import { parseApiError } from '@/shared/utils/errorHandler';

export function useSendLoginOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.sendOtp(phone),
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error(message);
    },
  });
}

export function useVerifyLoginOtp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) => authApi.verifyOtp(phone, otp),
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user }));
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
