package com.sliit.library.dto;

import com.sliit.library.model.*;
import java.time.LocalDateTime;

public class FineDto {
    
    public record UserInfo(
        Long id,
        String username,
        String name,
        String email
    ) {}
    
    public record BookInfo(
        Long id,
        String title,
        String authorName,
        String isbn
    ) {}
    
    public record FineResponse(
        Long id,
        Long userId,
        Long transactionId,
        FineType type,
        Double amount,
        Double paidAmount,
        Double remainingAmount,
        FineStatus status,
        LocalDateTime createdAt,
        LocalDateTime dueDate,
        UserInfo user,
        BookInfo book
    ) {}
    
    public record CreateFineRequest(
        Long userId,
        FineType type,
        Double amount,
        String description
    ) {}
    
    public record PayFineRequest(
        Double amount,
        String paymentReference
    ) {}
    
    public record WaiveFineRequest(
        String reason
    ) {}
}
