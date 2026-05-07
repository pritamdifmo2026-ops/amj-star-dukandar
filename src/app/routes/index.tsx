import { createBrowserRouter } from 'react-router-dom';
import { publicRoutes } from './public.routes';
import { protectedRoutes } from './protected.routes';
import RootLayout from './RootLayout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      ...publicRoutes,
      ...protectedRoutes,
      {
        path: '*',
        element: <div style={{ padding: '40px', textAlign: 'center' }}>404 - Not Found</div>,
      },
    ],
  },
]);
