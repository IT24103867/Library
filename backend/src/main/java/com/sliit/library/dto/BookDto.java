package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class BookDto {
    public static record BookCreateRequest(
        @NotBlank @Size(min = 2, max = 100) String title,
        @NotNull Long authorId,
        @NotNull Long publisherId,
        @NotBlank String isbn,
        @NotNull Integer year,
        @NotNull Long languageId,
        @NotNull Long categoryId,
        String description,
        String coverImage
    ) {}

    public static record BookUpdateRequest(
        @Size(min = 2, max = 100) String title,
        Long authorId,
        Long publisherId,
        String isbn,
        Integer year,
        Long languageId,
        Long categoryId,
        String description,
        String coverImage
    ) {}

    public static record BookSummaryResponse(
        Long id,
        String title,
        String isbn,
        String authorName,
        String publisherName,
        String categoryName,
        String languageName,
        Integer year,
        String coverImage,
        Double averageRating,
        Long totalReviews,
        LocalDateTime createdAt
    ) {}

    public static record BookResponse(
        Long id,
        String title,
        Long authorId,
        Long publisherId,
        String isbn,
        Integer year,
        Long languageId,
        Long categoryId,
        String description,
        String coverImage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Double averageRating,
        Long totalReviews,
        String authorName,
        String publisherName,
        String categoryName,
        String languageName
    ) {}
}
