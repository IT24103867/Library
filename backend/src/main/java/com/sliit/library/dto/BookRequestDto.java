package com.sliit.library.dto;

import com.sliit.library.model.*;
import java.time.LocalDateTime;

public class BookRequestDto {
    
    public record BookRequestResponse(
        Long id,
        Long userId,
        Long bookId,
        RequestStatus status,
        LocalDateTime requestedAt,
        LocalDateTime expiresAt,
        Integer queuePosition
    ) {}
    
    public record CreateBookRequestRequest(
        Long bookId,
        String notes
    ) {}
    
    public record BookQueueResponse(
        Long bookId,
        String bookTitle,
        java.util.List<BookRequestResponse> queue
    ) {}
}
