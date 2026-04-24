import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '@/shared/components/navigation/ScrollToTop';
import { Toaster } from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';

const RootLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  // Sync latest user data from backend on mount or when token changes
  useEffect(() => {
    const syncProfile = async () => {
      if (token) {
        try {
          const response = await authService.getMe(token);
          dispatch(setCredentials({ token, user: response.user }));
        } catch (err) {
          console.error('Failed to sync profile', err);
          // Optional: if 401, could trigger logout here
        }
      }
    };
    syncProfile();
  }, [token, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Toaster />
      <Outlet />
    </>
  );
};

export default RootLayout;
