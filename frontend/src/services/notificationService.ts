import type { Notification, NotificationUnreadCount } from '../types/notification';

const API_BASE_URL = 'http://localhost:8080/api';

class NotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getNotifications(): Promise<Notification[]> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  async getUnreadCount(): Promise<NotificationUnreadCount> {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    return response.json();
  }

  async markAsRead(notificationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  }
}

export const notificationService = new NotificationService();