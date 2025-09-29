package com.sliit.library.service;

import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ConflictException;
import com.sliit.library.exception.ForbiddenException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.BookCopyRepository;
import com.sliit.library.repository.BookTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookTransactionService {

    private final BookTransactionRepository transactionRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BookCopyService bookCopyService;
    private final LibraryPolicyService policyService;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final FineService fineService;
    private final BookRequestService bookRequestService;

    @Transactional
    public BookTransaction issueBook(User user, BookCopy bookCopy, User issuedBy, String notes) {
        LibraryPolicy policy = policyService.getActivePolicy();

        // Check if user has reached maximum books limit
        long activeTransactions = transactionRepository.countActiveTransactionsByUser(user);
        if (activeTransactions >= policy.getMaxBooksPerUser()) {
            throw new BusinessException("Maximum number of books already checked out (" + policy.getMaxBooksPerUser() + ")");
        }

        // Check if book copy is available
        if (bookCopy.getStatus() != BookStatus.AVAILABLE) {
            throw new ConflictException("Book copy is not available");
        }

        // Check if user has outstanding fines
        if (fineService.hasUnpaidFines(user)) {
            throw new BusinessException("Cannot issue books while having unpaid fines");
        }

        // Create transaction
        BookTransaction transaction = new BookTransaction();
        transaction.setUser(user);
        transaction.setBookCopy(bookCopy);
        transaction.setStatus(TransactionStatus.ACTIVE);
        transaction.setIssuedAt(LocalDateTime.now());
        transaction.setDueDate(LocalDateTime.now().plusDays(policy.getBorrowingPeriodDays()));
        transaction.setIssuedBy(issuedBy);
        transaction.setNotes(notes);
        transaction.setMaxRenewals(policy.getRenewalLimit());

        BookTransaction savedTransaction = transactionRepository.save(transaction);

        // Update book copy status
        bookCopy.setStatus(BookStatus.CHECKED_OUT);
        bookCopyRepository.save(bookCopy);

        // Log activity
        activityService.logActivity(user, ActivityType.BOOK_ISSUED, 
            "Checked out book: " + bookCopy.getBook().getTitle(), 
            null, bookCopy.getBook().getId(), savedTransaction.getId(), null);

        // Send notification (fail-safe)
        try {
            notificationService.sendBookIssueConfirmation(savedTransaction);
        } catch (Exception e) {
            // Log the error but don't fail the transaction
            log.warn("Failed to send book issue confirmation notification: " + e.getMessage());
        }

        return savedTransaction;
    }

    @Transactional
    public BookTransaction returnBook(BookCopy bookCopy, User returnedTo, BookCondition returnCondition, String notes) {
        BookTransaction transaction = transactionRepository.findByBookCopyAndStatus(bookCopy, TransactionStatus.ACTIVE)
            .orElseThrow(() -> new RuntimeException("No active transaction found for this book copy"));

        transaction.setStatus(TransactionStatus.RETURNED);
        transaction.setReturnedAt(LocalDateTime.now());
        transaction.setReturnedTo(returnedTo);
        transaction.setReturnCondition(returnCondition);
        if (notes != null) {
            transaction.setNotes(transaction.getNotes() + "; Return notes: " + notes);
        }

        // Calculate overdue days and fine
        if (transaction.getReturnedAt().isAfter(transaction.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(transaction.getDueDate(), transaction.getReturnedAt());
            transaction.setOverdueDays((int) overdueDays);
            
            // Create fine for overdue
            if (overdueDays > policyService.getActivePolicy().getGracePeriodDays()) {
                fineService.createOverdueFine(transaction, overdueDays);
            }
        }

        // Handle damaged book
        if (returnCondition == BookCondition.DAMAGED || returnCondition == BookCondition.POOR) {
            bookCopy.setCondition(returnCondition);
            bookCopy.setStatus(BookStatus.DAMAGED);
            
            // Check if a damaged book fine already exists for this transaction
            boolean fineAlreadyExists = fineService.existsByTransactionIdAndType(transaction.getId(), FineType.DAMAGED);
            if (!fineAlreadyExists) {
                fineService.createDamagedBookFine(transaction, returnCondition);
            }
        } else {
            bookCopy.setStatus(BookStatus.AVAILABLE);
        }

        BookTransaction savedTransaction = transactionRepository.save(transaction);
        bookCopyRepository.save(bookCopy);

        // Log activity
        activityService.logActivity(transaction.getUser(), ActivityType.BOOK_RETURNED, 
            "Returned book: " + bookCopy.getBook().getTitle(), 
            null, bookCopy.getBook().getId(), savedTransaction.getId(), null);

        // Send notification
        notificationService.sendBookReturnConfirmation(savedTransaction);

        // Check if anyone is waiting for this book
        checkAndFulfillRequests(bookCopy.getBook());

        return savedTransaction;
    }

    @Transactional
    public BookTransaction renewBook(Long transactionId, User user) {
        LibraryPolicy policy = policyService.getActivePolicy();

        if (!policy.getAllowRenewal()) {
            throw new BusinessException("Book renewal is not allowed by library policy");
        }

        BookTransaction transaction = transactionRepository.findById(transactionId)
            .orElseThrow(() -> new ResourceNotFoundException("Book transaction not found"));

        if (!transaction.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only renew your own books");
        }

        if (transaction.getStatus() != TransactionStatus.ACTIVE) {
            throw new BusinessException("Only active transactions can be renewed");
        }

        if (transaction.getRenewalCount() >= transaction.getMaxRenewals()) {
            throw new BusinessException("Maximum renewals reached (" + transaction.getMaxRenewals() + ")");
        }

        // Check if book has pending requests
        if (bookRequestService.getBookQueue(transaction.getBookCopy().getBook()).size() > 0) {
            throw new ConflictException("Cannot renew book with pending requests");
        }

        // Check for overdue fines
        if (fineService.hasUnpaidFines(user)) {
            throw new BusinessException("Cannot renew books while having unpaid fines");
        }

        transaction.setRenewalCount(transaction.getRenewalCount() + 1);
        transaction.setLastRenewalDate(LocalDateTime.now());
        transaction.setDueDate(transaction.getDueDate().plusDays(policy.getBorrowingPeriodDays()));
        transaction.setStatus(TransactionStatus.RENEWED);

        BookTransaction savedTransaction = transactionRepository.save(transaction);

        // Log activity
        activityService.logActivity(user, ActivityType.BOOK_RENEWED, 
            "Renewed book: " + transaction.getBookCopy().getBook().getTitle(), 
            null, transaction.getBookCopy().getBook().getId(), savedTransaction.getId(), null);

        // Send notification
        notificationService.sendBookRenewalConfirmation(savedTransaction);

        return savedTransaction;
    }

    @Transactional
    public void processOverdueBooks() {
        List<BookTransaction> overdueTransactions = transactionRepository.findOverdueTransactions(LocalDateTime.now());
        
        for (BookTransaction transaction : overdueTransactions) {
            if (transaction.getStatus() == TransactionStatus.ACTIVE) {
                transaction.setStatus(TransactionStatus.OVERDUE);
                
                long overdueDays = ChronoUnit.DAYS.between(transaction.getDueDate(), LocalDateTime.now());
                transaction.setOverdueDays((int) overdueDays);
                
                transactionRepository.save(transaction);

                // Create or update fine
                fineService.updateOverdueFine(transaction, overdueDays);

                // Send overdue notification
                notificationService.sendOverdueNotification(transaction);

                // Log activity
                activityService.logActivity(transaction.getUser(), ActivityType.BOOK_OVERDUE, 
                    "Book overdue: " + transaction.getBookCopy().getBook().getTitle(), 
                    null, transaction.getBookCopy().getBook().getId(), transaction.getId(), null);
            }
        }
    }

    @Transactional
    public void sendDueReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        LocalDateTime dayAfterTomorrow = LocalDateTime.now().plusDays(2);
        
        List<BookTransaction> dueSoonTransactions = transactionRepository.findTransactionsDueBetween(tomorrow, dayAfterTomorrow);
        
        for (BookTransaction transaction : dueSoonTransactions) {
            if (transaction.getStatus() == TransactionStatus.ACTIVE) {
                notificationService.sendBookDueReminder(transaction);
            }
        }
    }

    private void checkAndFulfillRequests(Book book) {
        if (bookCopyService.isBookAvailable(book)) {
            List<BookRequest> queue = bookRequestService.getBookQueue(book);
            if (!queue.isEmpty()) {
                BookRequest nextRequest = queue.get(0);
                // Notify the next person in queue
                notificationService.sendBookRequestFulfillment(nextRequest);
            }
        }
    }

    public List<BookTransaction> getUserActiveTransactions(User user) {
        return transactionRepository.findActiveTransactionsByUser(user);
    }

    public List<BookTransaction> getUserTransactionHistory(User user) {
        return transactionRepository.findByUserOrderByIssuedAtDesc(user);
    }

    public List<BookTransaction> getAllActiveTransactions() {
        return transactionRepository.findActiveTransactions();
    }

    public List<BookTransaction> getAllTransactionHistory() {
        return transactionRepository.findAllOrderByIssuedAtDesc();
    }

    public List<BookTransaction> getAllTransactions() {
        return transactionRepository.findAllOrderByIssuedAtDesc();
    }

    public List<BookTransaction> getUserAllTransactions(User user) {
        return transactionRepository.findByUserOrderByIssuedAtDesc(user);
    }

    public List<BookTransaction> getOverdueTransactions() {
        return transactionRepository.findOverdueTransactions(LocalDateTime.now());
    }

    public List<BookTransaction> getRenewableTransactions() {
        return transactionRepository.findRenewableTransactions();
    }

    public BookTransaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Transaction not found"));
    }

    public long getActiveTransactionCount(User user) {
        return transactionRepository.countActiveTransactionsByUser(user);
    }

    @Transactional
    public void markBookAsLost(Long transactionId, User librarian) {
        BookTransaction transaction = getTransactionById(transactionId);
        
        transaction.setStatus(TransactionStatus.LOST);
        transaction.getBookCopy().setStatus(BookStatus.LOST);
        transactionRepository.save(transaction);

        // Create lost book fine
        fineService.createLostBookFine(transaction);

        // Log activity
        activityService.logActivity(transaction.getUser(), ActivityType.BOOK_LOST, 
            "Book marked as lost: " + transaction.getBookCopy().getBook().getTitle(), 
            null, transaction.getBookCopy().getBook().getId(), transaction.getId(), null);
    }
}
