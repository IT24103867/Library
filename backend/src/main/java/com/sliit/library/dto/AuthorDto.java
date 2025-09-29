package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthorDto {
    public static record AuthorCreateRequest(
        @NotBlank @Size(min = 2, max = 50) String name,
        @NotBlank @Size(min = 2) String biography,
        String picture
    ) {}

    public static record AuthorUpdateRequest(
        @Size(min = 2, max = 50) String name,
        @Size(min = 2) String biography,
        String picture
    ) {}

    public static record AuthorResponse(
        Long id,
        String name,
        String biography,
        String picture,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}
