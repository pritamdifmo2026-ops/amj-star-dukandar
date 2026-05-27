importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCo3t3dmeG0G5MnO86Wz5Ok7JvBQtRuzdk',
  authDomain: 'amjstar-c186c.firebaseapp.com',
  projectId: 'amjstar-c186c',
  storageBucket: 'amjstar-c186c.firebasestorage.app',
  messagingSenderId: '190568500437',
  appId: '1:190568500437:web:b77afb054b3a0c7549265c',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'AMJSTAR Notification';
  const body = payload.notification?.body || '';
  const link = payload.fcmOptions?.link || payload.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { link },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          client.navigate(link);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
