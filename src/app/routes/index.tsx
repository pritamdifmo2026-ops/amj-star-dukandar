import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './public.routes';
import { protectedRoutes } from './protected.routes';
import RootLayout from './RootLayout';
import NotFound from '@/pages/NotFound';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...publicRoutes,
      ...protectedRoutes,
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
