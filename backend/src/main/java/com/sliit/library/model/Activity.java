package com.sliit.library.model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType type;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // IP Address for tracking
    private String ipAddress;

    // User Agent for browser/device tracking
    @Column(length = 500)
    private String userAgent;

    // Additional metadata as JSON
    @Column(columnDefinition = "JSON")
    private String metadata;

    // Related entity references
    private Long relatedBookId;
    private Long relatedTransactionId;
    private Long relatedFineId;

    @Enumerated(EnumType.STRING)
    private ActivitySeverity severity = ActivitySeverity.INFO;

    @PrePersist
    void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Explicit getters and setters for compilation compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public ActivityType getType() { return type; }
    public void setType(ActivityType type) { this.type = type; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
    
    public Long getRelatedBookId() { return relatedBookId; }
    public void setRelatedBookId(Long relatedBookId) { this.relatedBookId = relatedBookId; }
    
    public Long getRelatedTransactionId() { return relatedTransactionId; }
    public void setRelatedTransactionId(Long relatedTransactionId) { this.relatedTransactionId = relatedTransactionId; }
    
    public Long getRelatedFineId() { return relatedFineId; }
    public void setRelatedFineId(Long relatedFineId) { this.relatedFineId = relatedFineId; }
    
    public ActivitySeverity getSeverity() { return severity; }
    public void setSeverity(ActivitySeverity severity) { this.severity = severity; }
}
