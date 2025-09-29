package com.sliit.library.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.BookReviewDto.*;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.exception.ValidationException;
import com.sliit.library.model.Book;
import com.sliit.library.model.BookReview;
import com.sliit.library.model.User;
import com.sliit.library.repository.BookRepository;
import com.sliit.library.repository.BookReviewRepository;
import com.sliit.library.repository.UserRepository;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class BookReviewService {

    private final BookReviewRepository bookReviewRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final CurrentUser currentUser;

    public BookReviewService(BookReviewRepository bookReviewRepository, 
                           BookRepository bookRepository,
                           UserRepository userRepository,
                           CurrentUser currentUser) {
        this.bookReviewRepository = bookReviewRepository;
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.currentUser = currentUser;
    }

    public BookReviewResponse createReview(BookReviewCreateRequest request) {
        User user = currentUser.require();
        
        // Check if user already reviewed this book
        if (bookReviewRepository.existsByUserIdAndBookId(user.getId(), request.getBookId())) {
            throw new ValidationException("User has already reviewed this book");
        }
        
        Book book = bookRepository.findById(request.getBookId())
            .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        BookReview review = new BookReview();
        review.setUser(user);
        review.setBook(book);
        review.setRating(request.getRating());
        review.setReview(request.getReview());

        BookReview savedReview = bookReviewRepository.save(review);
        return toResponse(savedReview);
    }

    public BookReviewResponse updateReview(Long reviewId, BookReviewUpdateRequest request) {
        User user = currentUser.require();
        BookReview review = bookReviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new ValidationException("User can only update their own reviews");
        }

        review.setRating(request.getRating());
        review.setReview(request.getReview());

        BookReview updatedReview = bookReviewRepository.save(review);
        return toResponse(updatedReview);
    }

    public void deleteReview(Long reviewId) {
        User user = currentUser.require();
        BookReview review = bookReviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new ValidationException("User can only delete their own reviews");
        }

        bookReviewRepository.delete(review);
    }

    @Transactional(readOnly = true)
    public BookReviewResponse getReviewById(Long reviewId) {
        BookReview review = bookReviewRepository.findById(reviewId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public List<BookReviewResponse> getReviewsByBook(Long bookId, int page, int pageSize) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found");
        }

        Pageable pageable = PageRequest.of(page, pageSize);
        List<BookReview> reviews = bookReviewRepository.findByBookIdOrderByCreatedAtDesc(bookId, pageable);
        return reviews.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookReviewResponse> getReviewsByUser(Long userId, int page, int pageSize) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }

        Pageable pageable = PageRequest.of(page, pageSize);
        List<BookReview> reviews = bookReviewRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return reviews.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookReviewSummary getBookReviewSummary(Long bookId) {
        if (!bookRepository.existsById(bookId)) {
            throw new ResourceNotFoundException("Book not found");
        }

        Book book = bookRepository.findById(bookId).get();
        Double averageRating = bookReviewRepository.findAverageRatingByBookId(bookId);
        Long totalReviews = bookReviewRepository.countByBookId(bookId);

        BookReviewSummary summary = new BookReviewSummary();
        summary.setBookId(bookId);
        summary.setBookTitle(book.getTitle());
        summary.setAverageRating(averageRating != null ? averageRating : 0.0);
        summary.setTotalReviews(totalReviews);
        summary.setFiveStarCount(bookReviewRepository.countByBookIdAndRating(bookId, 5));
        summary.setFourStarCount(bookReviewRepository.countByBookIdAndRating(bookId, 4));
        summary.setThreeStarCount(bookReviewRepository.countByBookIdAndRating(bookId, 3));
        summary.setTwoStarCount(bookReviewRepository.countByBookIdAndRating(bookId, 2));
        summary.setOneStarCount(bookReviewRepository.countByBookIdAndRating(bookId, 1));

        return summary;
    }

    @Transactional(readOnly = true)
    public List<BookReviewResponse> getMyReviews(int page, int pageSize) {
        User user = currentUser.require();
        Pageable pageable = PageRequest.of(page, pageSize);
        List<BookReview> reviews = bookReviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        return reviews.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookReviewResponse getMyReviewForBook(Long bookId) {
        User user = currentUser.require();
        BookReview review = bookReviewRepository.findByUserIdAndBookId(user.getId(), bookId)
            .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        return toResponse(review);
    }

    @Transactional(readOnly = true)
    public List<BookReviewResponse> getAllReviews(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);
        return bookReviewRepository.findAll(pageable)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private BookReviewResponse toResponse(BookReview review) {
        BookReviewResponse response = new BookReviewResponse();
        response.setId(review.getId());
        response.setUserId(review.getUser().getId());
        response.setBookId(review.getBook().getId());
        response.setRating(review.getRating());
        response.setReview(review.getReview());
        response.setCreatedAt(review.getCreatedAt());
        response.setUpdatedAt(review.getUpdatedAt());
        return response;
    }
}
