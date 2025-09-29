package com.sliit.library.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.sliit.library.dto.BookReviewDto.*;
import com.sliit.library.service.BookReviewService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/book-reviews")
public class BookReviewController {

    private final BookReviewService bookReviewService;

    public BookReviewController(BookReviewService bookReviewService) {
        this.bookReviewService = bookReviewService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookReviewResponse createReview(@Valid @RequestBody BookReviewCreateRequest request) {
        return bookReviewService.createReview(request);
    }

    @PatchMapping("/{reviewId}")
    public BookReviewResponse updateReview(@PathVariable Long reviewId,
                                         @Valid @RequestBody BookReviewUpdateRequest request) {
        return bookReviewService.updateReview(reviewId, request);
    }

    @DeleteMapping("/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable Long reviewId) {
        bookReviewService.deleteReview(reviewId);
    }

    @GetMapping("/{reviewId}")
    public BookReviewResponse getReview(@PathVariable Long reviewId) {
        return bookReviewService.getReviewById(reviewId);
    }

    @GetMapping("/book/{bookId}")
    public List<BookReviewResponse> getReviewsByBook(@PathVariable Long bookId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int pageSize) {
        return bookReviewService.getReviewsByBook(bookId, page, pageSize);
    }

    @GetMapping("/user/{userId}")
    public List<BookReviewResponse> getReviewsByUser(@PathVariable Long userId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int pageSize) {
        return bookReviewService.getReviewsByUser(userId, page, pageSize);
    }

    @GetMapping("/my-reviews")
    public List<BookReviewResponse> getMyReviews(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int pageSize) {
        return bookReviewService.getMyReviews(page, pageSize);
    }

    @GetMapping("/book/{bookId}/summary")
    public BookReviewSummary getBookReviewSummary(@PathVariable Long bookId) {
        return bookReviewService.getBookReviewSummary(bookId);
    }

    @GetMapping("/my-review/book/{bookId}")
    public BookReviewResponse getMyReviewForBook(@PathVariable Long bookId) {
        return bookReviewService.getMyReviewForBook(bookId);
    }

    @GetMapping
    public List<BookReviewResponse> getAllReviews(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int pageSize) {
        return bookReviewService.getAllReviews(page, pageSize);
    }
}
