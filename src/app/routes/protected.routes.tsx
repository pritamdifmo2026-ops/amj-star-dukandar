import type { RouteObject } from 'react-router-dom';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import EmptyState from '@/shared/components/feedback/EmptyState';
import Profile from '@/features/buyer/pages/Profile';

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
            <div style={{ padding: '40px' }}>
              <EmptyState title="Reseller Dashboard" description="We are building powerful tools for you. Coming very soon!" />
            </div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.SUPPLIER_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['supplier']}>
            <div style={{ padding: '40px' }}>
              <EmptyState title="Supplier Dashboard" description="We are building powerful tools for you. Coming very soon!" />
            </div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.ADMIN_DASHBOARD,
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <div style={{ padding: '40px' }}>
              <EmptyState title="Admin Dashboard" description="Admin tools are coming soon!" />
            </div>
          </ProtectedRoute>
        ),
      },
      {
        path: ROUTES.RESELLER_CART,
        element: <EmptyState title="Cart" description="Cart is coming soon!" />,
      }
    ],
  },
];
