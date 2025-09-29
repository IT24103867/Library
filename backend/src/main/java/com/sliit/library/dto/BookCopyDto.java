package com.sliit.library.dto;

import java.time.LocalDateTime;

import com.sliit.library.model.BookStatus;
import com.sliit.library.model.BookCondition;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class BookCopyDto {
    public static record BookCopyCreateRequest(
        @NotNull Long bookId,
        @NotBlank @Size(min = 1, max = 100) String barcode,
        @NotNull BookStatus status,
        boolean isReferenceOnly,
        BookCondition condition,
        String location
    ) {}

    public static record BookCopyUpdateRequest(
        @NotNull Long bookId,
        @NotNull BookStatus status,
        @NotBlank @Size(min = 1, max = 100) String barcode,
        Boolean isReferenceOnly,
        BookCondition condition,
        String location
    ) {}

    public static record BookCopyResponse(
        Long id,
        Long bookId,
        String bookTitle,
        String bookAuthorName,
        String bookIsbn,
        BookStatus status,
        String barcode,
        boolean isReferenceOnly,
        BookCondition condition,
        String location,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}
