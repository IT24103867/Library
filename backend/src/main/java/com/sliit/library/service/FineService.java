package com.sliit.library.service;

import com.sliit.library.dto.FineDto;
import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.FineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FineService {

    private final FineRepository fineRepository;
    private final LibraryPolicyService policyService;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    @Transactional
    public Fine createOverdueFine(BookTransaction transaction, long overdueDays) {
        LibraryPolicy policy = policyService.getActivePolicy();
        
        // Calculate fine amount (excluding grace period)
        long fineableDays = Math.max(0, overdueDays - policy.getGracePeriodDays());
        double fineAmount = Math.min(fineableDays * policy.getFinePerDayOverdue(), policy.getMaxFineAmount());
        
        if (fineAmount <= 0) {
            return null; // No fine if within grace period
        }

        Fine fine = new Fine();
        fine.setUser(transaction.getUser());
        fine.setTransaction(transaction);
        fine.setType(FineType.OVERDUE);
        fine.setAmount(fineAmount);
        fine.setDescription(String.format("Overdue fine for book '%s' - %d days overdue", 
            transaction.getBookCopy().getBook().getTitle(), overdueDays));
        fine.setCreatedBy(transaction.getIssuedBy()); // System created
        fine.setStatus(FineStatus.PENDING);

        Fine savedFine = fineRepository.save(fine);

        // Update transaction fine amount
        transaction.setFineAmount(fineAmount);

        // Log activity
        activityService.logActivity(transaction.getUser(), ActivityType.FINE_CREATED, 
            "Overdue fine created: $" + fineAmount, 
            null, transaction.getBookCopy().getBook().getId(), transaction.getId(), savedFine.getId());

        // Send notification
        notificationService.sendFineNotification(savedFine);

        return savedFine;
    }

    @Transactional
    public Fine updateOverdueFine(BookTransaction transaction, long overdueDays) {
        // Try to find existing overdue fine for this transaction
        Optional<Fine> existingFine = fineRepository.findByUserAndStatus(transaction.getUser(), FineStatus.PENDING)
            .stream()
            .filter(f -> f.getTransaction() != null && f.getTransaction().getId().equals(transaction.getId()))
            .filter(f -> f.getType() == FineType.OVERDUE)
            .findFirst();

        if (existingFine.isPresent()) {
            // Update existing fine
            Fine fine = existingFine.get();
            LibraryPolicy policy = policyService.getActivePolicy();
            
            long fineableDays = Math.max(0, overdueDays - policy.getGracePeriodDays());
            double newFineAmount = Math.min(fineableDays * policy.getFinePerDayOverdue(), policy.getMaxFineAmount());
            
            fine.setAmount(newFineAmount);
            fine.setDescription(String.format("Overdue fine for book '%s' - %d days overdue (Updated)", 
                transaction.getBookCopy().getBook().getTitle(), overdueDays));

            Fine savedFine = fineRepository.save(fine);
            transaction.setFineAmount(newFineAmount);

            return savedFine;
        } else {
            // Create new fine
            return createOverdueFine(transaction, overdueDays);
        }
    }

    @Transactional
    public Fine createDamagedBookFine(BookTransaction transaction, BookCondition condition) {
        LibraryPolicy policy = policyService.getActivePolicy();
        
        // Calculate fine based on book value (assuming we have book price)
        // For now, use a percentage of a standard book price
        double standardBookPrice = 50.0; // This should ideally come from book entity
        double fineAmount = standardBookPrice * (policy.getDamagedBookFinePercentage() / 100.0);

        Fine fine = new Fine();
        fine.setUser(transaction.getUser());
        fine.setTransaction(transaction);
        fine.setType(FineType.DAMAGED);
        fine.setAmount(fineAmount);
        fine.setDescription(String.format("Damaged book fine for '%s' - Condition: %s", 
            transaction.getBookCopy().getBook().getTitle(), condition.toString()));
        fine.setCreatedBy(transaction.getReturnedTo());
        fine.setStatus(FineStatus.PENDING);

        Fine savedFine = fineRepository.save(fine);

        // Log activity
        activityService.logActivity(transaction.getUser(), ActivityType.BOOK_DAMAGED, 
            "Damaged book fine created: $" + fineAmount, 
            null, transaction.getBookCopy().getBook().getId(), transaction.getId(), savedFine.getId());

        // Send notification
        notificationService.sendFineNotification(savedFine);

        return savedFine;
    }

    @Transactional
    public Fine createLostBookFine(BookTransaction transaction) {
        LibraryPolicy policy = policyService.getActivePolicy();
        
        // Calculate fine based on book value
        double standardBookPrice = 50.0; // This should ideally come from book entity
        double fineAmount = standardBookPrice * (policy.getLostBookFinePercentage() / 100.0);

        Fine fine = new Fine();
        fine.setUser(transaction.getUser());
        fine.setTransaction(transaction);
        fine.setType(FineType.LOST);
        fine.setAmount(fineAmount);
        fine.setDescription(String.format("Lost book fine for '%s'", 
            transaction.getBookCopy().getBook().getTitle()));
        fine.setCreatedBy(transaction.getIssuedBy()); // System created
        fine.setStatus(FineStatus.PENDING);

        Fine savedFine = fineRepository.save(fine);

        // Log activity
        activityService.logActivity(transaction.getUser(), ActivityType.FINE_CREATED, 
            "Lost book fine created: $" + fineAmount, 
            null, transaction.getBookCopy().getBook().getId(), transaction.getId(), savedFine.getId());

        // Send notification
        notificationService.sendFineNotification(savedFine);

        return savedFine;
    }

    @Transactional
    public Fine createCustomFine(User user, FineType type, double amount, String description, User createdBy) {
        Fine fine = new Fine();
        fine.setUser(user);
        fine.setType(type);
        fine.setAmount(amount);
        fine.setDescription(description);
        fine.setCreatedBy(createdBy);
        fine.setStatus(FineStatus.PENDING);

        Fine savedFine = fineRepository.save(fine);

        // Log activity
        activityService.logActivity(user, ActivityType.FINE_CREATED, 
            "Custom fine created: $" + amount + " - " + description, 
            null, null, null, savedFine.getId());

        // Send notification
        notificationService.sendFineNotification(savedFine);

        return savedFine;
    }

    @Transactional
    public void payFine(Long fineId, double amount, User paidBy, String paymentReference) {
        Fine fine = fineRepository.findById(fineId)
            .orElseThrow(() -> new ResourceNotFoundException("Fine not found"));

        if (fine.getStatus() == FineStatus.PAID) {
            throw new BusinessException("Fine is already paid");
        }

        double newPaidAmount = fine.getPaidAmount() + amount;
        fine.setPaidAmount(newPaidAmount);

        if (newPaidAmount >= fine.getAmount()) {
            fine.setStatus(FineStatus.PAID);
            fine.setPaidAt(LocalDateTime.now());
        } else {
            fine.setStatus(FineStatus.PARTIALLY_PAID);
        }

        fine.setPaymentReference(paymentReference);
        Fine savedFine = fineRepository.save(fine);

        // Update transaction if applicable
        if (fine.getTransaction() != null) {
            fine.getTransaction().setFinePaid(fine.isFullyPaid());
        }

        // Log activity
        activityService.logActivity(fine.getUser(), ActivityType.FINE_PAID, 
            String.format("Fine payment: $%.2f (Total paid: $%.2f / $%.2f)", 
                amount, newPaidAmount, fine.getAmount()), 
            null, null, null, savedFine.getId());
    }

    @Transactional
    public void waiveFine(Long fineId, User waivedBy, String reason) {
        Fine fine = fineRepository.findById(fineId)
            .orElseThrow(() -> new ResourceNotFoundException("Fine not found"));

        if (fine.getStatus() == FineStatus.PAID) {
            throw new BusinessException("Cannot waive a paid fine");
        }

        fine.setStatus(FineStatus.WAIVED);
        fine.setDescription(fine.getDescription() + " - WAIVED: " + reason);
        fine.setReceivedBy(waivedBy);
        Fine savedFine = fineRepository.save(fine);

        // Update transaction if applicable
        if (fine.getTransaction() != null) {
            fine.getTransaction().setFinePaid(true);
        }

        // Log activity
        activityService.logActivity(fine.getUser(), ActivityType.FINE_WAIVED, 
            "Fine waived: $" + fine.getAmount() + " - " + reason, 
            null, null, null, savedFine.getId());
    }

    public boolean hasUnpaidFines(User user) {
        List<Fine> unpaidFines = fineRepository.findUnpaidFinesByUser(user);
        return !unpaidFines.isEmpty();
    }

    public boolean existsByTransactionIdAndType(Long transactionId, FineType type) {
        return fineRepository.existsByTransactionIdAndType(transactionId, type);
    }

    public double getTotalUnpaidAmount(User user) {
        Double amount = fineRepository.getTotalUnpaidAmountByUser(user);
        return amount != null ? amount : 0.0;
    }

    public List<Fine> getUserFines(User user) {
        return fineRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Fine> getUnpaidFines(User user) {
        return fineRepository.findUnpaidFinesByUser(user);
    }

    public List<Fine> getOverdueFines() {
        return fineRepository.findOverdueFines(LocalDateTime.now());
    }

    public Fine getFineById(Long id) {
        return fineRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Fine not found"));
    }

    @Transactional
    public void processOverdueFineReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        LocalDateTime dayAfterTomorrow = LocalDateTime.now().plusDays(2);
        
        List<Fine> finesDueSoon = fineRepository.findFinesDueBetween(tomorrow, dayAfterTomorrow);
        
        for (Fine fine : finesDueSoon) {
            if (fine.getStatus() == FineStatus.PENDING || fine.getStatus() == FineStatus.PARTIALLY_PAID) {
                // Send reminder notification
                notificationService.sendFineReminder(fine);
            }
        }
    }

    // DTO methods for API responses
    public FineDto.FineResponse toDto(Fine fine) {
        FineDto.UserInfo userInfo = new FineDto.UserInfo(
            fine.getUser().getId(),
            fine.getUser().getUsername() != null ? fine.getUser().getUsername() : "N/A",
            fine.getUser().getName() != null ? fine.getUser().getName() : "Unknown User",
            fine.getUser().getEmail() != null ? fine.getUser().getEmail() : "N/A"
        );
        
        FineDto.BookInfo bookInfo = null;
        if (fine.getTransaction() != null && fine.getTransaction().getBookCopy() != null) {
            var book = fine.getTransaction().getBookCopy().getBook();
            if (book != null) {
                String authorName = book.getAuthor() != null ? book.getAuthor().getName() : "Unknown Author";
                String title = book.getTitle() != null ? book.getTitle() : "Unknown Title";
                String isbn = book.getIsbn() != null ? book.getIsbn() : "N/A";
                
                bookInfo = new FineDto.BookInfo(
                    book.getId(),
                    title,
                    authorName,
                    isbn
                );
            }
        }
        
        return new FineDto.FineResponse(
            fine.getId(),
            fine.getUser().getId(),
            fine.getTransaction() != null ? fine.getTransaction().getId() : null,
            fine.getType(),
            fine.getAmount(),
            fine.getPaidAmount(),
            fine.getRemainingAmount(),
            fine.getStatus(),
            fine.getCreatedAt(),
            fine.getDueDate(),
            userInfo,
            bookInfo
        );
    }

    public List<FineDto.FineResponse> getUserFineDtos(User user) {
        return getUserFines(user).stream()
            .map(this::toDto)
            .toList();
    }

    public List<FineDto.FineResponse> getUnpaidFineDtos(User user) {
        return getUnpaidFines(user).stream()
            .map(this::toDto)
            .toList();
    }

    public List<FineDto.FineResponse> getOverdueFineDtos() {
        return getOverdueFines().stream()
            .map(this::toDto)
            .toList();
    }

    public List<FineDto.FineResponse> getAllFineDtos(int page, int pageSize) {
        // For now, return all fines - in a real app you'd implement pagination
        return fineRepository.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    public FineDto.FineResponse getFineDtoById(Long id) {
        return toDto(getFineById(id));
    }
}
