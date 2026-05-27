import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import toast from 'react-hot-toast';
import { messaging } from '@/lib/firebase';
import { notificationApi } from '../notificationApi';
import { useAppSelector } from '@/store/hooks';

export function useFcmToken() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribe: (() => void) | undefined;

    const setup = async () => {
      try {
        // Wait briefly for messaging to initialize (isSupported() is async)
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
          await notificationApi.saveFcmToken(token);
        }

        // Handle foreground messages
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'New Notification';
          const body = payload.notification?.body ?? '';
          toast(
            `${title}${body ? ': ' + body : ''}`,
            { duration: 5000 }
          );
        });
      } catch (err) {
        // Never crash the app for FCM failures
        console.warn('FCM setup failed (non-fatal):', err);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated]);
}
