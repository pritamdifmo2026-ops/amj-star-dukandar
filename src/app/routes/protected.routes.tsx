import { Navigate, type RouteObject } from 'react-router-dom';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Profile from '@/features/buyer/pages/Profile';
import Onboarding from '@/features/supplier/pages/Onboarding';
import SupplierGuard from '@/features/supplier/components/SupplierGuard';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import SupplierDashboard from '@/features/supplier/pages/SupplierDashboard';

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

      {
        path: ROUTES.RESELLER_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['reseller']}>
            <SupplierDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/supplier/onboarding',
    element: (
      <ProtectedRoute allowedRoles={['supplier', 'reseller']}>
        <Onboarding />
      </ProtectedRoute>
    ),
  },
  {
    path: ROUTES.RESELLER_ONBOARDING,
    element: (
      <ProtectedRoute allowedRoles={['reseller']}>
        <Onboarding />
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
