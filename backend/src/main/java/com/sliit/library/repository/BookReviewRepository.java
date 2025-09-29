package com.sliit.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sliit.library.model.BookReview;

@Repository
public interface BookReviewRepository extends JpaRepository<BookReview, Long> {
    
    List<BookReview> findByBookIdOrderByCreatedAtDesc(Long bookId, Pageable pageable);
    
    List<BookReview> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    Optional<BookReview> findByUserIdAndBookId(Long userId, Long bookId);
    
    @Query("SELECT AVG(br.rating) FROM BookReview br WHERE br.book.id = :bookId")
    Double findAverageRatingByBookId(@Param("bookId") Long bookId);
    
    @Query("SELECT COUNT(br) FROM BookReview br WHERE br.book.id = :bookId")
    Long countByBookId(@Param("bookId") Long bookId);
    
    @Query("SELECT COUNT(br) FROM BookReview br WHERE br.book.id = :bookId AND br.rating = :rating")
    Long countByBookIdAndRating(@Param("bookId") Long bookId, @Param("rating") Integer rating);
    
    @Query("SELECT br FROM BookReview br WHERE br.book.id = :bookId ORDER BY br.createdAt DESC")
    List<BookReview> findByBookIdOrderByCreatedAtDesc(@Param("bookId") Long bookId);
    
    boolean existsByUserIdAndBookId(Long userId, Long bookId);
}
