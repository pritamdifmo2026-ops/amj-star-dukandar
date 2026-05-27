import apiClient from '@/api/client';

export interface INotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getAll: () =>
    apiClient.get('/notifications').then((r) => r.data.notifications as INotification[]),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
  saveFcmToken: (token: string) => apiClient.patch('/user/fcm-token', { fcmToken: token }),
};
