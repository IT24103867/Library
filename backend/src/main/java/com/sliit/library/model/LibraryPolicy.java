package com.sliit.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "library_policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LibraryPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String policyName;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Borrowing policies
    private Integer maxBooksPerUser = 5;
    private Integer borrowingPeriodDays = 14;
    private Integer renewalLimit = 2;
    private Integer gracePeriodDays = 3;

    // Fine policies
    private Double finePerDayOverdue = 1.0;
    private Double maxFineAmount = 50.0;
    private Double damagedBookFinePercentage = 50.0;
    private Double lostBookFinePercentage = 100.0;

    // Request policies
    private Integer maxRequestsPerUser = 3;
    private Integer requestExpiryDays = 7;

    // System policies
    private Boolean allowRenewal = true;
    private Boolean allowRequests = true;
    private Boolean emailNotifications = true;
    private Boolean smsNotifications = false;

    @Enumerated(EnumType.STRING)
    private PolicyStatus status = PolicyStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = true)
    private User createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
