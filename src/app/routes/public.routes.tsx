import type { RouteObject } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import AuthLayout from '@/shared/layout/AuthLayout';
import Login from '@/features/auth/pages/Login';
import VerifyOtp from '@/features/auth/pages/VerifyOtp';
import Register from '@/features/auth/pages/Register';
import VerifyEmail from '@/features/auth/pages/VerifyEmail';
import Landing from '@/features/landing/pages/Landing';
import ProductList from '@/features/product/pages/ProductList';
import ProductDetail from '@/features/product/pages/ProductDetail';
import AddProduct from '@/features/product/pages/AddProduct';
import AdminLogin from '@/features/admin/pages/AdminLogin';
import StorefrontDispatcher from '@/pages/StorefrontDispatcher';
import SupplierVerifyEmail from '@/features/supplier/pages/VerifyEmail';
import Cart from '@/features/buyer/pages/Cart';
import Checkout from '@/features/order/pages/Checkout';
import Payment from '@/features/order/pages/Payment';
import Addresses from '@/features/buyer/pages/Addresses';
import About from '@/features/landing/pages/About';
import Buyers from '@/features/landing/pages/Buyers';
import Resellers from '@/features/landing/pages/Resellers';
import Suppliers from '@/features/landing/pages/Suppliers';
import Contact from '@/features/landing/pages/Contact';
import Terms from '@/features/landing/pages/Terms';
import Privacy from '@/features/landing/pages/Privacy';

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
    element: <Cart />,
  },
  {
    path: ROUTES.CHECKOUT,
    element: <Checkout />,
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
