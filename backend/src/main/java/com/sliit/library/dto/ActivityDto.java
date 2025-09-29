package com.sliit.library.dto;

import java.time.LocalDateTime;

import com.sliit.library.model.ActivityType;
import com.sliit.library.model.User;

public final class ActivityDto {

    public record ActivityCreateRequest(
            Long id,
            User user,
            ActivityType type,
            String message

    ) {}

    public record ActivityResponse(
            Long id,
            Long userId,
            ActivityType type,
            String message,
            LocalDateTime timestamp
    ) {}
}
