export interface Notification {
  id: number;
  type: string;
  subject: string;
  message: string;
  status: string;
  channel: string;
  createdAt: string;
  readAt?: string;
  userId: number;
}

export interface NotificationUnreadCount {
  unreadCount: number;
}