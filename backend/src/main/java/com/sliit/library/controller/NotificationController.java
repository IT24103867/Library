package com.sliit.library.controller;

import com.sliit.library.dto.NotificationDto;
import com.sliit.library.model.*;
import com.sliit.library.service.NotificationService;
import com.sliit.library.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    @GetMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<NotificationDto>> getMyNotifications() {
        User user = currentUser.require();
        return ResponseEntity.ok(notificationService.getUserNotifications(user));
    }

    @PostMapping("/{id}/mark-read")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> markAsRead(@PathVariable Long id) {
        User user = currentUser.require();
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok("Notification marked as read");
    }

    @PostMapping("/{id}/read")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> markAsReadPost(@PathVariable Long id) {
        User user = currentUser.require();
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok("Notification marked as read");
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getUnreadCount() {
        User user = currentUser.require();
        long count = notificationService.getUnreadNotificationCount(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> markAllAsRead() {
        User user = currentUser.require();
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok("All notifications marked as read");
    }

    @PostMapping("/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cleanupOldNotifications() {
        notificationService.cleanupOldNotifications();
        return ResponseEntity.ok("Old notifications cleaned up");
    }
}
