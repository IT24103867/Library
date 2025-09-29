package com.sliit.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status = NotificationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private NotificationChannel channel = NotificationChannel.IN_APP;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime sentAt;
    private LocalDateTime readAt;

    private Integer retryCount = 0;
    private Integer maxRetries = 3;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    // Additional metadata as JSON
    @Column(columnDefinition = "JSON")
    private String metadata;

    private String externalReference; // For tracking email/SMS IDs

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public boolean canRetry() {
        return retryCount < maxRetries;
    }
}
