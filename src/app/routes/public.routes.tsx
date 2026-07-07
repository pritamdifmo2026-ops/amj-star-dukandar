import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import AuthLayout from '@/shared/layout/AuthLayout';
import Login from '@/features/auth/pages/Login';
import VerifyOtp from '@/features/auth/pages/VerifyOtp';
import Register from '@/features/auth/pages/Register';
import VerifyEmail from '@/features/auth/pages/VerifyEmail';
import Landing from '@/features/landing/pages/Landing';
import ProductDetail from '@/features/product/pages/ProductDetail';
import ProductList from '@/features/product/pages/ProductList';
import AddProduct from '@/features/product/pages/AddProduct';
import AdminLogin from '@/features/admin/pages/AdminLogin';
import StorefrontDispatcher from '@/pages/StorefrontDispatcher';
import SupplierVerifyEmail from '@/features/supplier/pages/VerifyEmail';
import Payment from '@/features/order/pages/Payment';
import Addresses from '@/features/buyer/pages/Addresses';
import About from '@/features/landing/pages/About';
import Buyers from '@/features/landing/pages/Buyers';
import Resellers from '@/features/landing/pages/Resellers';
import Suppliers from '@/features/landing/pages/Suppliers';
import Contact from '@/features/landing/pages/Contact';
import Terms from '@/features/landing/pages/Terms';
import Privacy from '@/features/landing/pages/Privacy';
import VerifiedManufacturers from '@/features/landing/pages/VerifiedManufacturers';

export const publicRoutes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <Landing />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: ROUTES.BUYERS,
    element: <Buyers />,
  },
  {
    path: ROUTES.RESELLERS,
    element: <Resellers />,
  },
  {
    path: ROUTES.SUPPLIERS,
    element: <Suppliers />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/terms',
    element: <Terms />,
  },
  {
    path: '/privacy',
    element: <Privacy />,
  },
  {
    path: '/verified-manufacturers',
    element: <VerifiedManufacturers />,
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
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/store/:idOrSlug',
    element: <StorefrontDispatcher />,
  },
  {
    path: '/verify-supplier-email',
    element: <SupplierVerifyEmail />,
  },
  {
    path: ROUTES.CART,
    element: <Navigate to="/profile?tab=cart" replace />,
  },
  {
    path: ROUTES.CHECKOUT,
    element: <Navigate to="/profile?tab=checkout" replace />,
  },
  {
    path: ROUTES.PAYMENT,
    element: <Payment />,
  },
  {
    path: ROUTES.ADDRESSES,
    element: <Addresses />,
  }
];
