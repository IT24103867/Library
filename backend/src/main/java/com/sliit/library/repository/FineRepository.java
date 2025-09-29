package com.sliit.library.repository;

import com.sliit.library.model.Fine;
import com.sliit.library.model.FineStatus;
import com.sliit.library.model.FineType;
import com.sliit.library.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {
    
    List<Fine> findByUserAndStatus(User user, FineStatus status);
    
    @Query("SELECT f FROM Fine f WHERE f.user = :user AND f.status IN ('PENDING', 'PARTIALLY_PAID')")
    List<Fine> findUnpaidFinesByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(f.amount - f.paidAmount), 0.0) FROM Fine f WHERE f.status IN ('PENDING', 'PARTIALLY_PAID')")
    double sumOfPendingFines();
    
    @Query("SELECT f FROM Fine f WHERE f.status = 'PENDING' AND f.createdAt < :thirtyDaysAgo")
    List<Fine> findExpiredPendingFines(@Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo);
    
    @Query("SELECT SUM(f.amount - f.paidAmount) FROM Fine f WHERE f.user = :user AND f.status IN ('PENDING', 'PARTIALLY_PAID')")
    Double getTotalUnpaidAmountByUser(@Param("user") User user);
    
    @Query("SELECT f FROM Fine f WHERE f.dueDate < :date AND f.status = 'PENDING'")
    List<Fine> findOverdueFines(@Param("date") LocalDateTime date);
    
    List<Fine> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT f FROM Fine f WHERE f.status = 'PENDING' AND f.dueDate BETWEEN :startDate AND :endDate")
    List<Fine> findFinesDueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    boolean existsByTransactionIdAndType(Long transactionId, FineType type);
}
