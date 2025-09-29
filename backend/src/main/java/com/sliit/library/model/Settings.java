package com.sliit.library.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Settings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "system_name", nullable = false)
    private String systemName = "Library Management System";

    @Column(name = "system_email")
    private String systemEmail = "admin@library.com";

    @Column(name = "max_books_per_user", nullable = false)
    private Integer maxBooksPerUser = 5;

    @Column(name = "loan_period_days", nullable = false)
    private Integer loanPeriodDays = 14;

    @Column(name = "fine_per_day", nullable = false)
    private Double finePerDay = 10.0;

    @Column(name = "membership_fee", nullable = false)
    private Double membershipFee = 500.0;

    @Column(name = "allow_self_registration", nullable = false)
    private Boolean allowSelfRegistration = true;

    @Column(name = "email_notifications", nullable = false)
    private Boolean emailNotifications = true;

    @Column(name = "maintenance_mode", nullable = false)
    private Boolean maintenanceMode = false;

    @Column(name = "backup_frequency")
    private String backupFrequency = "daily";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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