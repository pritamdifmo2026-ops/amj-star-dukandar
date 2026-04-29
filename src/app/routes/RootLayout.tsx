import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import ScrollToTop from '@/shared/components/navigation/ScrollToTop';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout } from '@/store/slices/auth.slice';
import authService from '@/features/auth/services/auth.service';

const RootLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // Sync latest user data from backend on mount or when token changes
  useEffect(() => {
    const syncProfile = async () => {
      if (isAuthenticated) {
        try {
          const response = await authService.getMe();
          dispatch(setCredentials({ user: response.user }));
        } catch (err: any) {
          console.error('Failed to sync profile', err);
          if (err.response?.status === 401) {
            dispatch(logout());
          }
        }
      }
    };
    syncProfile();
  }, [isAuthenticated, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

export default RootLayout;
