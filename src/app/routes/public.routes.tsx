import type { RouteObject } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import AuthLayout from '@/shared/layout/AuthLayout';
import Login from '@/features/auth/pages/Login';
import VerifyOtp from '@/features/auth/pages/VerifyOtp';
import SelectRole from '@/features/auth/pages/SelectRole';
import Register from '@/features/auth/pages/Register';
import Landing from '@/features/landing/pages/Landing';
import ProductList from '@/features/product/pages/ProductList';
import ProductDetail from '@/features/product/pages/ProductDetail';
import AddProduct from '@/features/product/pages/AddProduct';

export const publicRoutes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <Landing />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <Login />,
      },
      {
        path: ROUTES.VERIFY_OTP,
        element: <VerifyOtp />,
      },
      {
        path: ROUTES.SELECT_ROLE,
        element: <SelectRole />,
      },
      {
        path: ROUTES.REGISTER,
        element: <Register />,
      },
    ],
  },
  {
    path: ROUTES.PRODUCT_LIST,
    element: <ProductList />,
  },
  {
    path: ROUTES.PRODUCT_DETAIL,
    element: <ProductDetail />,
  },
  {
    path: '/products/add', // Temporarily public for testing
    element: <AddProduct />,
  }
];
