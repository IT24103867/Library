package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class BookReviewDto {

    @Data
    public static class BookReviewCreateRequest {
        @NotNull(message = "Book ID is required")
        private Long bookId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        private Integer rating;

        @Size(max = 1000, message = "Review cannot exceed 1000 characters")
        private String review;
    }

    @Data
    public static class BookReviewUpdateRequest {
        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        private Integer rating;

        @Size(max = 1000, message = "Review cannot exceed 1000 characters")
        private String review;
    }

    @Data
    public static class BookReviewResponse {
        private Long id;
        private Long userId;
        private Long bookId;
        private Integer rating;
        private String review;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class BookReviewSummary {
        private Long bookId;
        private String bookTitle;
        private Double averageRating;
        private Long totalReviews;
        private Long fiveStarCount;
        private Long fourStarCount;
        private Long threeStarCount;
        private Long twoStarCount;
        private Long oneStarCount;
    }
}
