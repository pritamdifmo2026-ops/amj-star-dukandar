import { Navigate, type RouteObject } from 'react-router-dom';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import Profile from '@/features/buyer/pages/Profile';
import Onboarding from '@/features/supplier/pages/Onboarding';
import SupplierGuard from '@/features/supplier/components/SupplierGuard';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import SupplierDashboard from '@/features/supplier/pages/SupplierDashboard';
import ResellerDashboard from '@/features/reseller/pages/ResellerDashboard';
import ResellerOnboarding from '@/features/reseller/pages/ResellerOnboarding';
import ResellerGuard from '@/features/reseller/components/ResellerGuard';

export const protectedRoutes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: ROUTES.RESELLER_DASHBOARD,
    element: (
      <ProtectedRoute allowedRoles={['reseller']}>
        <ResellerGuard>
          <ResellerDashboard />
        </ResellerGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/supplier/onboarding',
    element: (
      <ProtectedRoute allowedRoles={['supplier']}>
        <Onboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.RESELLER_ONBOARDING,
    element: (
      <ProtectedRoute allowedRoles={['reseller']}>
        <ResellerOnboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.SUPPLIER_DASHBOARD,
    element: (
      <ProtectedRoute allowedRoles={['supplier']}>
        <SupplierGuard>
          <SupplierDashboard />
        </SupplierGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: <Navigate to="/admin/login" replace />,
  }
];
