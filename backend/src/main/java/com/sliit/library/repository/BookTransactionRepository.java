package com.sliit.library.repository;

import com.sliit.library.model.BookTransaction;
import com.sliit.library.model.TransactionStatus;
import com.sliit.library.model.User;
import com.sliit.library.model.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookTransactionRepository extends JpaRepository<BookTransaction, Long> {
    
    List<BookTransaction> findByUserAndStatus(User user, TransactionStatus status);
    
    Optional<BookTransaction> findByBookCopyAndStatus(BookCopy bookCopy, TransactionStatus status);
    
    @Query("SELECT t FROM BookTransaction t WHERE t.user = :user AND t.status = 'ACTIVE'")
    List<BookTransaction> findActiveTransactionsByUser(@Param("user") User user);
    
    @Query("SELECT t FROM BookTransaction t WHERE t.dueDate < :date AND t.status = 'ACTIVE'")
    List<BookTransaction> findOverdueTransactions(@Param("date") LocalDateTime date);
    
    @Query("SELECT t FROM BookTransaction t WHERE t.dueDate BETWEEN :startDate AND :endDate AND t.status = 'ACTIVE'")
    List<BookTransaction> findTransactionsDueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(t) FROM BookTransaction t WHERE t.user = :user AND t.status = 'ACTIVE'")
    long countActiveTransactionsByUser(@Param("user") User user);
    
    List<BookTransaction> findByUserOrderByIssuedAtDesc(User user);
    
    @Query("SELECT t FROM BookTransaction t WHERE t.status = 'ACTIVE' AND t.renewalCount < t.maxRenewals")
    List<BookTransaction> findRenewableTransactions();
    
    @Query("SELECT t FROM BookTransaction t WHERE t.status = 'ACTIVE' ORDER BY t.issuedAt DESC")
    List<BookTransaction> findActiveTransactions();
    
    @Query("SELECT t FROM BookTransaction t ORDER BY t.issuedAt DESC")
    List<BookTransaction> findAllOrderByIssuedAtDesc();
    
    long countByStatus(TransactionStatus status);
}
