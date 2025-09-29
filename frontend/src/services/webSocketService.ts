import * as Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import type { Notification } from '../types/notification';

class WebSocketService {
  private stompClient: Stomp.Client | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  // Callbacks for handling messages
  private onNotificationCallback?: (notification: Notification) => void;
  private onUnreadCountCallback?: (count: number) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;

  constructor() {
    this.connect();
  }

  private connect() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!token) {
      console.warn('No authentication token found, skipping WebSocket connection');
      return;
    }

    // Create SockJS connection
    const socket = new SockJS('http://localhost:8080/ws');

    // Create STOMP client
    this.stompClient = Stomp.over(socket);

    // Configure STOMP client
    this.stompClient.heartbeat.outgoing = 10000;
    this.stompClient.heartbeat.incoming = 10000;

    // Debug logging
    this.stompClient.debug = (str: string) => {
      console.log('STOMP: ' + str);
    };

    this.stompClient.connect(
      { Authorization: `Bearer ${token}` },
      (frame: any) => {
        console.log('Connected to WebSocket:', frame);
        this.isConnected = true;
        this.reconnectAttempts = 0;

        // Subscribe to user-specific notifications
        this.stompClient?.subscribe('/user/queue/notifications', (message: any) => {
          const notification: Notification = JSON.parse(message.body);
          console.log('Received notification:', notification);
          this.onNotificationCallback?.(notification);
        });

        // Subscribe to unread count updates
        this.stompClient?.subscribe('/user/queue/notifications/unread-count', (message: any) => {
          const data = JSON.parse(message.body);
          const count = data.unreadCount || 0;
          console.log('Received unread count update:', count);
          this.onUnreadCountCallback?.(count);
        });

        this.onConnectCallback?.();
      },
      (error: any) => {
        console.error('STOMP connection error:', error);
        this.isConnected = false;
        this.onDisconnectCallback?.();

        // Attempt to reconnect if not manually disconnected
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      }
    );
  }

  public disconnect() {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.onDisconnectCallback?.();
      });
    }
  }

  public isWebSocketConnected(): boolean {
    return this.isConnected && this.stompClient?.connected === true;
  }

  // Set callback functions
  public onNotification(callback: (notification: Notification) => void) {
    this.onNotificationCallback = callback;
  }

  public onUnreadCountUpdate(callback: (count: number) => void) {
    this.onUnreadCountCallback = callback;
  }

  public onConnect(callback: () => void) {
    this.onConnectCallback = callback;
  }

  public onDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  // Send messages to server (if needed)
  public send(destination: string, body: any) {
    if (this.stompClient && this.isConnected) {
      this.stompClient.send(destination, {}, JSON.stringify(body));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService();