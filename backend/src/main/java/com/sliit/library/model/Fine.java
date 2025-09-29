package com.sliit.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "transaction_id")
    private BookTransaction transaction;

    @Enumerated(EnumType.STRING)
    private FineType type;

    @Column(nullable = false)
    private Double amount;

    private Double paidAmount = 0.0;

    @Enumerated(EnumType.STRING)
    private FineStatus status = FineStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;
    private LocalDateTime dueDate;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "received_by")
    private User receivedBy;

    // Payment reference for tracking
    private String paymentReference;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (dueDate == null) {
            dueDate = createdAt.plusDays(30); // Default 30 days to pay
        }
    }

    public Double getRemainingAmount() {
        return amount - paidAmount;
    }

    public boolean isFullyPaid() {
        return paidAmount >= amount;
    }
}
