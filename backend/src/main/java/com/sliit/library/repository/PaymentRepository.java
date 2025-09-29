package com.sliit.library.repository;

import com.sliit.library.model.Payment;
import com.sliit.library.model.PaymentStatus;
import com.sliit.library.model.PaymentType;
import com.sliit.library.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByOrderID(String orderID);
    
    Optional<Payment> findByPaymentID(String paymentID);
    
    List<Payment> findByUserAndStatusOrderByCreatedAtDesc(User user, PaymentStatus status);
    
    List<Payment> findByUserOrderByCreatedAtDesc(User user);
    
    List<Payment> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PaymentStatus status);
    
    List<Payment> findByStatusOrderByCreatedAtDesc(PaymentStatus status);
    
    List<Payment> findAllByOrderByCreatedAtDesc();
    
    List<Payment> findByType(PaymentType type);
    
    long countByStatus(PaymentStatus status);
    
    @Query("SELECT p FROM Payment p WHERE p.status = :status AND p.createdAt BETWEEN :startDate AND :endDate")
    List<Payment> findPaymentsByStatusAndDateRange(@Param("status") PaymentStatus status, 
                                                   @Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED' AND p.paidAt BETWEEN :startDate AND :endDate")
    Double getTotalPaymentsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'COMPLETED'")
    Double getTotalAmount();
    
    @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.createdAt < :cutoffTime")
    List<Payment> findExpiredPendingPayments(@Param("cutoffTime") LocalDateTime cutoffTime);
}
