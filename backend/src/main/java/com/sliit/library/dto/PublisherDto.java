package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;

public final class PublisherDto {
    public static record PublisherCreateRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @Size(max = 255) String address,
        @Size(max = 20) String contactNumber,
        @Email @Size(max = 100) String email,
        @Size(max = 100) String website,
        @Size(max = 255) String picture,
        @Size(max = 500) String description
    ) {}

    public static record PublisherUpdateRequest(
        @Size(min = 2, max = 100) String name,
        @Size(max = 255) String address,
        @Size(max = 20) String contactNumber,
        @Email @Size(max = 100) String email,
        @Size(max = 100) String website,
        @Size(max = 255) String picture,
        @Size(max = 500) String description
    ) {}

    public static record PublisherResponse(
        Long id,
        String name,
        String address,
        String contactNumber,
        String email,
        String website,
        String picture,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}
}
