package com.sliit.library.dto;

import com.sliit.library.model.*;
import java.time.LocalDateTime;

public class TransactionDto {
    
    public record TransactionResponse(
        Long id,
        Long userId,
        String userName,
        Long bookCopyId,
        String bookTitle,
        String isbn,
        TransactionStatus status,
        LocalDateTime issuedAt,
        LocalDateTime dueDate,
        LocalDateTime returnedAt,
        Integer renewalCount,
        Integer maxRenewals,
        Integer overdueDays,
        Double fineAmount,
        Boolean finePaid,
        BookCondition returnCondition,
        String notes
    ) {}
    
    public record IssueBookRequest(
        Long userId,
        Long bookCopyId,
        String notes
    ) {}
    
    public record ReturnBookRequest(
        Long bookCopyId,
        BookCondition returnCondition,
        String notes
    ) {}
    
    public record RenewalRequest(
        Long transactionId
    ) {}
}
