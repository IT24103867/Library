package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class CategoryDto {
    public static record CategoryCreateRequest(
        @NotBlank @Size(min = 2, max = 50) String name
    ) {}

    public static record CategoryUpdateRequest(
        @Size(min = 2, max = 50) String name
    ) {}

    public static record CategoryResponse(
        Long id,
        String name,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}
