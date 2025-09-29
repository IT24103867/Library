package com.sliit.library.repository;

import com.sliit.library.model.BookRequest;
import com.sliit.library.model.RequestStatus;
import com.sliit.library.model.User;
import com.sliit.library.model.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookRequestRepository extends JpaRepository<BookRequest, Long> {
    
    List<BookRequest> findByUserAndStatus(User user, RequestStatus status);
    
    List<BookRequest> findByBookAndStatus(Book book, RequestStatus status);
    
    @Query("SELECT COUNT(r) FROM BookRequest r WHERE r.user = :user AND r.status = :status")
    long countByUserAndStatus(@Param("user") User user, @Param("status") RequestStatus status);
    
    @Query("SELECT r FROM BookRequest r WHERE r.book = :book AND r.status = 'PENDING' ORDER BY r.requestedAt ASC")
    List<BookRequest> findQueueForBook(@Param("book") Book book);
    
    @Query("SELECT r FROM BookRequest r WHERE r.expiresAt < :now AND r.status = 'PENDING'")
    List<BookRequest> findExpiredRequests(@Param("now") LocalDateTime now);
    
    Optional<BookRequest> findByUserAndBookAndStatus(User user, Book book, RequestStatus status);
    
    @Query("SELECT COUNT(r) FROM BookRequest r WHERE r.status = :status")
    long countByStatus(@Param("status") RequestStatus status);
    
    @Query("SELECT r FROM BookRequest r WHERE r.status = 'PENDING'")
    List<BookRequest> findAllPendingRequests();
}
