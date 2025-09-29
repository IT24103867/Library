package com.sliit.library.dto;

import com.sliit.library.model.*;
import java.time.LocalDateTime;

public class PaymentDto {
    
    public record PaymentResponse(
        Long id,
        Long userId,
        String userName,
        Long fineId,
        Double amount,
        PaymentType type,
        PaymentStatus status,
        PaymentMethod method,
        String orderID,
        String paymentID,
        String description,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        String transactionReference
    ) {}
    
    public record InitiatePaymentRequest(
        Long fineId,
        PaymentMethod method
    ) {}
    
    public record DirectPaymentRequest(
        Long fineId,
        PaymentMethod method,
        String reference
    ) {}
}
