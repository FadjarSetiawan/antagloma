import { api } from './api';

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: 'ORDER_CREATED' | 'ORDER_APPROVED' | 'PACKING_COMPLETED' | 'SHIPMENT_COMPLETED';
  link?: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
}

export const notificationService = {
  async getNotifications() {
    const res = await api.get<{ success: boolean; unread_count: number; data: AppNotification[] }>('/notifications');
    return res.data;
  },

  async markAsRead(id: number) {
    const res = await api.post<{ success: boolean; message: string }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.post<{ success: boolean; message: string }>('/notifications/read-all');
    return res.data;
  },
};
