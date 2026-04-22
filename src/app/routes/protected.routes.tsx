import React from 'react';
import type { RouteObject } from 'react-router-dom';
import MainLayout from '@/shared/layout/MainLayout';
import { ROUTES } from '@/shared/constants/routes';

export const protectedRoutes: RouteObject[] = [
  {
    element: <MainLayout />,
    children: [
      {
        path: ROUTES.RESELLER_DASHBOARD,
        element: <div>Reseller Dashboard (Coming Soon)</div>,
      },
      {
        path: ROUTES.SUPPLIER_DASHBOARD,
        element: <div>Supplier Dashboard (Coming Soon)</div>,
      },
      {
        path: ROUTES.ADMIN_DASHBOARD,
        element: <div>Admin Dashboard (Coming Soon)</div>,
      },
      {
        path: ROUTES.RESELLER_CART,
        element: <div>Cart Page (Coming Soon)</div>,
      }
    ],
  },
];
