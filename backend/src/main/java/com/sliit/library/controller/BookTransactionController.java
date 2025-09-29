package com.sliit.library.controller;

import com.sliit.library.model.*;
import com.sliit.library.service.BookTransactionService;
import com.sliit.library.service.BookCopyService;
import com.sliit.library.service.UserService;
import com.sliit.library.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@Slf4j
public class BookTransactionController {

    private final BookTransactionService transactionService;
    private final BookCopyService bookCopyService;
    private final UserService userService;
    private final CurrentUser currentUser;

    private TransactionDto toTransactionDto(BookTransaction transaction) {
        return new TransactionDto(
            transaction.getId(),
            transaction.getUser().getId(),
            transaction.getUser().getName(),
            transaction.getBookCopy().getId(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getBookCopy().getBook().getIsbn(),
            transaction.getStatus(),
            transaction.getIssuedAt(),
            transaction.getDueDate(),
            transaction.getReturnedAt(),
            transaction.getOverdueDays(),
            transaction.getFineAmount(),
            transaction.getReturnCondition(),
            transaction.getNotes()
        );
    }

    private TransactionSummaryDto toTransactionSummaryDto(BookTransaction transaction) {
        return new TransactionSummaryDto(
            transaction.getId(),
            transaction.getBookCopy().getId(),
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getBookCopy().getBook().getAuthor().getName(),
            transaction.getBookCopy().getBook().getIsbn(),
            transaction.getBookCopy().getBarcode(),
            transaction.getStatus(),
            transaction.getIssuedAt(),
            transaction.getDueDate(),
            transaction.getReturnedAt(),
            transaction.getOverdueDays(),
            transaction.getFineAmount(),
            transaction.getFinePaid()
        );
    }

    @PostMapping("/issue")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<TransactionDto> issueBook(@Valid @RequestBody IssueBookDto issueDto) {
        try {
            log.info("Processing book issue request for user ID: {} and book copy ID: {}", issueDto.userId(), issueDto.bookCopyId());
            User librarian = currentUser.require();
            User borrower = userService.findByIdEntity(issueDto.userId());
            BookCopy bookCopy = bookCopyService.findByIdEntity(issueDto.bookCopyId());
            BookTransaction transaction = transactionService.issueBook(borrower, bookCopy, librarian, issueDto.notes());
            log.info("Book issued successfully with transaction ID: {}", transaction.getId());
            return ResponseEntity.ok(toTransactionDto(transaction));
        } catch (Exception e) {
            log.error("Error processing book issue for user ID: {} and book copy ID: {}", issueDto.userId(), issueDto.bookCopyId(), e);
            throw e;
        }
    }

    @PostMapping("/return")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<TransactionDto> returnBook(@Valid @RequestBody ReturnBookDto returnDto) {
        User librarian = currentUser.require();
        BookCopy bookCopy = bookCopyService.findByIdEntity(returnDto.bookCopyId());
        BookTransaction transaction = transactionService.returnBook(bookCopy, librarian, 
            returnDto.returnCondition(), returnDto.notes());
        return ResponseEntity.ok(toTransactionDto(transaction));
    }

    @PostMapping("/{id}/renew")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<TransactionDto> renewBook(@PathVariable Long id) {
        try {
            log.info("Processing book renewal request for transaction ID: {}", id);
            User user = currentUser.require();
            BookTransaction transaction = transactionService.renewBook(id, user);
            log.info("Book renewed successfully for transaction ID: {}", id);
            return ResponseEntity.ok(toTransactionDto(transaction));
        } catch (Exception e) {
            log.error("Error processing book renewal for transaction ID: {}", id, e);
            throw e;
        }
    }

    @GetMapping("/my-active")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<TransactionSummaryDto>> getMyActiveTransactions() {
        User user = currentUser.require();
        List<BookTransaction> transactions;

        // Admin and Librarian can see all active transactions
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.LIBRARIAN) {
            transactions = transactionService.getAllActiveTransactions();
        } else {
            // Members only see their own active transactions
            transactions = transactionService.getUserActiveTransactions(user);
        }

        List<TransactionSummaryDto> dtos = transactions.stream()
            .map(this::toTransactionSummaryDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/my-history")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<TransactionSummaryDto>> getMyTransactionHistory() {
        User user = currentUser.require();
        List<BookTransaction> transactions;

        // Admin and Librarian can see all transaction history
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.LIBRARIAN) {
            transactions = transactionService.getAllTransactionHistory();
        } else {
            // Members only see their own transaction history
            transactions = transactionService.getUserTransactionHistory(user);
        }

        List<TransactionSummaryDto> dtos = transactions.stream()
            .map(this::toTransactionSummaryDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<TransactionSummaryDto>> getOverdueTransactions() {
        List<BookTransaction> transactions = transactionService.getOverdueTransactions();
        List<TransactionSummaryDto> dtos = transactions.stream()
            .map(this::toTransactionSummaryDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/renewable")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<TransactionSummaryDto>> getRenewableTransactions() {
        List<BookTransaction> transactions = transactionService.getRenewableTransactions();
        List<TransactionSummaryDto> dtos = transactions.stream()
            .map(this::toTransactionSummaryDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<TransactionSummaryDto>> getAllTransactions() {
        User user = currentUser.require();
        List<BookTransaction> transactions;

        // Admin and Librarian can see all transactions
        if (user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.LIBRARIAN) {
            transactions = transactionService.getAllTransactions();
        } else {
            // Members only see their own transactions
            transactions = transactionService.getUserAllTransactions(user);
        }

        List<TransactionSummaryDto> dtos = transactions.stream()
            .map(this::toTransactionSummaryDto)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransactionDto> getTransactionById(@PathVariable Long id) {
        BookTransaction transaction = transactionService.getTransactionById(id);
        return ResponseEntity.ok(toTransactionDto(transaction));
    }

    @PostMapping("/{id}/mark-lost")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> markBookAsLost(@PathVariable Long id) {
        User librarian = currentUser.require();
        transactionService.markBookAsLost(id, librarian);
        return ResponseEntity.ok("Book marked as lost successfully");
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getTransactionStats() {
        // This would include various statistics
        return ResponseEntity.ok(Map.of(
            "totalActiveTransactions", transactionService.getOverdueTransactions().size(),
            "overdueTransactions", transactionService.getOverdueTransactions().size(),
            "renewableTransactions", transactionService.getRenewableTransactions().size()
        ));
    }

    // DTOs
    public record TransactionDto(
        Long id,
        Long userId,
        String userName,
        Long bookCopyId,
        String bookTitle,
        String bookIsbn,
        TransactionStatus status,
        LocalDateTime issuedAt,
        LocalDateTime dueDate,
        LocalDateTime returnedAt,
        Integer overdueDays,
        Double fineAmount,
        BookCondition returnCondition,
        String notes
    ) {}

    public record TransactionSummaryDto(
        Long id,
        Long bookCopyId,
        String userName,
        String bookTitle,
        String bookAuthor,
        String bookIsbn,
        String bookCopyBarcode,
        TransactionStatus status,
        LocalDateTime issuedAt,
        LocalDateTime dueDate,
        LocalDateTime returnedAt,
        Integer overdueDays,
        Double fineAmount,
        Boolean finePaid
    ) {}

    public record IssueBookDto(Long userId, Long bookCopyId, String notes) {}
    public record ReturnBookDto(Long bookCopyId, BookCondition returnCondition, String notes) {}
}
