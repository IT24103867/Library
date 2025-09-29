package com.sliit.library.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.*;

import com.sliit.library.model.UserRole;
import com.sliit.library.model.UserStatus;

/** Container for user-related DTO records. */
public final class UserDto {

  public static record UserCreateRequest(
      @NotBlank @Size(min = 3, max = 50) String name,
      @NotBlank @Size(min = 3, max = 50) String username,
      @NotBlank @Email @Size(max = 100) String email,
      @NotBlank @Size(min = 8, max = 72) String password, // raw on input only
      UserRole role, // optional; default MEMBER if null
      String picture
  ) {}

  public static record UserResponse(
      Long id,
      String name,
      String username,
      String email,
      UserRole role,
      UserStatus status,
      String picture,
      LocalDateTime createdAt,
      LocalDateTime updatedAt
  ) {}

  public static record UserUpdateRequest(
      @Size(min = 3, max = 50) String username,
      @Email @Size(max = 100) String email,
      @Size(min = 8, max = 72) String newPassword,
      String name,
      UserRole role,
      UserStatus status,
      String picture
  ) {}

  public static record UserPageResponse(
      java.util.List<UserResponse> content,
      int totalPages,
      long totalElements,
      int page,
      int size
  ) {}
}
