package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class LanguageDto {
    public static record LanguageCreateRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @Size(max = 10) String code
    ) {}

    public static record LanguageUpdateRequest(
        @Size(min = 2, max = 100) String name,
        @Size(max = 10) String code
    ) {}

    public static record LanguageResponse(
        Long id,
        String name,
        String code,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}