package com.sliit.library.service;

import com.sliit.library.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send a notification to a specific user via WebSocket
     */
    public void sendNotificationToUser(Long userId, Notification notification) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );
    }

    /**
     * Send a notification to all connected users (broadcast)
     */
    public void broadcastNotification(Notification notification) {
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }

    /**
     * Send unread count update to a specific user
     */
    public void sendUnreadCountUpdate(Long userId, int unreadCount) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications/unread-count",
            Map.of("unreadCount", unreadCount)
        );
    }
}