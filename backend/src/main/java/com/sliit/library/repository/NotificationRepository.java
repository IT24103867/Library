package com.sliit.library.repository;

import com.sliit.library.model.Notification;
import com.sliit.library.model.NotificationStatus;
import com.sliit.library.model.NotificationType;
import com.sliit.library.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUserAndStatusOrderByCreatedAtDesc(User user, NotificationStatus status);
    
    @Query("SELECT n FROM Notification n WHERE n.status = :status AND n.retryCount < n.maxRetries ORDER BY n.createdAt ASC")
    List<Notification> findPendingNotifications(@Param("status") NotificationStatus status);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.readAt IS NULL")
    long countUnreadNotificationsByUser(@Param("user") User user);
    
    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type);
    
    @Query("SELECT n FROM Notification n WHERE n.createdAt < :cutoffDate AND n.status = 'SENT'")
    List<Notification> findOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    List<Notification> findByUserAndReadAtIsNull(User user);
    
    @Query("SELECT n FROM Notification n WHERE n.status = 'FAILED' AND n.retryCount < n.maxRetries")
    List<Notification> findFailedNotificationsForRetry();
}
