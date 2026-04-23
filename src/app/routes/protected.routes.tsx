import type { RouteObject } from 'react-router-dom';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';
import ProtectedRoute from '@/shared/components/ProtectedRoute';

export const protectedRoutes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: ROUTES.RESELLER_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['reseller']}>
            <div>Reseller Dashboard (Coming Soon)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPPLIER_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['supplier']}>
            <div>Supplier Dashboard (Coming Soon)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <div>Admin Dashboard (Coming Soon)</div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESELLER_CART,
        element: <div>Cart Page (Coming Soon)</div>,
      }
    ],
  },
];
