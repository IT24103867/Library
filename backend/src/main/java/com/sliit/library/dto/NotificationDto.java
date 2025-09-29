package com.sliit.library.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationDto {

    private Long id;
    private String type;
    private String subject;
    private String message;
    private String status;
    private String channel;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;

    // Minimal user info
    private Long userId;

    public NotificationDto(Long id, String type, String subject, String message,
                          String status, String channel, LocalDateTime createdAt,
                          LocalDateTime readAt, Long userId) {
        this.id = id;
        this.type = type;
        this.subject = subject;
        this.message = message;
        this.status = status;
        this.channel = channel;
        this.createdAt = createdAt;
        this.readAt = readAt;
        this.userId = userId;
    }
}
