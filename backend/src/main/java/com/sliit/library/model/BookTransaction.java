package com.sliit.library.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "book_copy_id", nullable = false)
    private BookCopy bookCopy;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status = TransactionStatus.ACTIVE;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @Column(nullable = false)
    private LocalDateTime dueDate;

    private LocalDateTime returnedAt;
    private LocalDateTime lastRenewalDate;
    
    private Integer renewalCount = 0;
    private Integer maxRenewals = 2;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @ManyToOne
    @JoinColumn(name = "returned_to")
    private User returnedTo;

    // Fine calculation fields
    private Integer overdueDays = 0;
    private Double fineAmount = 0.0;
    private Boolean finePaid = false;

    @Enumerated(EnumType.STRING)
    private BookCondition returnCondition;

    @Column(columnDefinition = "TEXT")
    private String damageDescription;

    @PrePersist
    protected void onCreate() {
        if (issuedAt == null) {
            issuedAt = LocalDateTime.now();
        }
        if (dueDate == null) {
            dueDate = issuedAt.plusDays(14); // Default 14 days
        }
    }
}
