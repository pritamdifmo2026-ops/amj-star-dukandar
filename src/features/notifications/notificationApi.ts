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
  getPaged: (page: number, limit = 20) =>
    apiClient.get(`/notifications?page=${page}&limit=${limit}`).then((r) => r.data as {
      notifications: INotification[];
      total: number;
      page: number;
      limit: number;
    }),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all'),
  saveFcmToken: (token: string) => apiClient.patch('/user/fcm-token', { fcmToken: token }),
};
