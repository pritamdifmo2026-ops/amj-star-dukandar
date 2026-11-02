import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Not authenticated at all — redirect to login with redirect path
  if (!isAuthenticated || !user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} state={{ from: location }} replace />;
  }

  // Authenticated but wrong role — redirect to their own dashboard instead of home screen
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleDashboards: Record<string, string> = {
      partner: '/partner/dashboard',
      supplier: '/supplier/dashboard',
      seller: '/supplier/dashboard',
      admin: '/admin/dashboard',
      superadmin: '/admin/dashboard',
      subadmin: '/admin/dashboard',
      reseller: '/reseller/dashboard',
      buyer: '/',
    };
    return <Navigate to={roleDashboards[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
