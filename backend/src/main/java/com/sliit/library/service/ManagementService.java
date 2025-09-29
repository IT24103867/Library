package com.sliit.library.service;

import com.sliit.library.model.ActivityType;
import com.sliit.library.model.BookStatus;
import com.sliit.library.model.RequestStatus;
import com.sliit.library.model.TransactionStatus;
import com.sliit.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManagementService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final CategoryRepository categoryRepository;
    private final BookTransactionRepository bookTransactionRepository;
    private final BookRequestRepository bookRequestRepository;
    private final FineRepository fineRepository;
    private final BookCopyRepository bookCopyRepository;
    private final ActivityRepository activityRepository;


    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Real entity counts
        stats.put("totalBooks", bookRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalAuthors", authorRepository.count());
        stats.put("totalPublishers", publisherRepository.count());
        stats.put("totalCategories", categoryRepository.count());

        // Real transaction data
        long activeTransactions = bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE);
        stats.put("activeTransactions", activeTransactions);

        // Real request data
        long pendingRequests = bookRequestRepository.countByStatus(RequestStatus.PENDING);
        stats.put("pendingRequests", pendingRequests);

        // Real fine data
        double outstandingFines = fineRepository.sumOfPendingFines();
        stats.put("outstandingFines", outstandingFines);

        return stats;
    }

    public Map<String, Object> getDetailedStats() {
        Map<String, Object> stats = new HashMap<>();

        // Real counts using existing repository methods
        stats.put("totalBooks", bookRepository.count());
        stats.put("totalUsers", userRepository.count());
        stats.put("totalCategories", categoryRepository.count());
        stats.put("totalAuthors", authorRepository.count());
        stats.put("totalPublishers", publisherRepository.count());

        // Real book availability data
        long availableCopies = bookCopyRepository.findByStatus(BookStatus.AVAILABLE).size();
        stats.put("availableBooks", availableCopies);
        stats.put("totalMembers", userRepository.count()); // All users are members

        // Real transaction data
        long activeBorrows = bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE);
        stats.put("activeBorrows", activeBorrows);

        // Real request data
        long pendingRequests = bookRequestRepository.countByStatus(RequestStatus.PENDING);
        stats.put("pendingRequests", pendingRequests);

        // Real fine data
        double outstandingFines = fineRepository.sumOfPendingFines();
        stats.put("outstandingFines", outstandingFines);

        return stats;
    }

    public Map<String, Object> getActivityStats() {
        Map<String, Object> stats = new HashMap<>();

        // Real activity data from the last 7 days
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        // Count different activity types
        long booksIssued = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_ISSUED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        long booksReturned = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_RETURNED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        long newMembers = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.USER_CREATED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        long newRequests = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_REQUESTED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        // Calculate fines collected (this would need payment tracking)
        stats.put("booksIssued", booksIssued);
        stats.put("booksReturned", booksReturned);
        stats.put("newMembers", newMembers);
        stats.put("newRequests", newRequests);
        stats.put("finesCollected", 0.0); // Would need payment history

        return stats;
    }

    public Map<String, Object> getBookStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalBooks = bookRepository.count();
        stats.put("totalBooks", totalBooks);
        // Mock book status data
        stats.put("availableBooks", totalBooks - 15);
        stats.put("checkedOutBooks", 15L);
        stats.put("reservedBooks", 3L);
        stats.put("maintenanceBooks", 1L);
        stats.put("lostBooks", 0L);
        
        // Mock popular categories
        List<Map<String, Object>> popularCategories = Arrays.asList(
            Map.of("name", "Fiction", "count", 25),
            Map.of("name", "Science", "count", 18),
            Map.of("name", "History", "count", 12)
        );
        stats.put("popularCategories", popularCategories);
        
        return stats;
    }

    public Map<String, Object> getUserStats() {
        Map<String, Object> stats = new HashMap<>();
        
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);
        // Mock user breakdown
        stats.put("activeMembers", totalUsers - 5);
        stats.put("suspendedMembers", 2L);
        stats.put("inactiveMembers", 1L);
        stats.put("newMembersThisMonth", 5L);
        
        return stats;
    }

    public Map<String, Object> getTransactionStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Mock transaction data
        stats.put("activeTransactions", 15L);
        stats.put("overdueTransactions", 3L);
        stats.put("completedTransactions", 150L);
        stats.put("totalRenewals", 25L);
        stats.put("averageCheckoutDuration", 12.5);
        
        return stats;
    }

    public Map<String, Object> getFineStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Mock fine data
        stats.put("totalFines", 25L);
        stats.put("unpaidFines", 8L);
        stats.put("paidFines", 15L);
        stats.put("waivedFines", 2L);
        stats.put("outstandingAmount", 125.50);
        stats.put("collectedAmount", 275.75);
        stats.put("waivedAmount", 45.25);
        
        return stats;
    }

    public List<Map<String, Object>> getPopularBooks() {
        // Mock popular books data
        return Arrays.asList(
            Map.of("title", "The Great Gatsby", "author", "F. Scott Fitzgerald", "checkouts", 15),
            Map.of("title", "To Kill a Mockingbird", "author", "Harper Lee", "checkouts", 12),
            Map.of("title", "1984", "author", "George Orwell", "checkouts", 10),
            Map.of("title", "Pride and Prejudice", "author", "Jane Austen", "checkouts", 8),
            Map.of("title", "The Catcher in the Rye", "author", "J.D. Salinger", "checkouts", 7)
        );
    }

    public List<Map<String, Object>> getRecentActivities() {
        // Mock recent activities
        return Arrays.asList(
            Map.of("type", "CHECKOUT", "description", "Book 'The Great Gatsby' checked out by John Doe", "timestamp", LocalDateTime.now().minusHours(2)),
            Map.of("type", "RETURN", "description", "Book '1984' returned by Jane Smith", "timestamp", LocalDateTime.now().minusHours(4)),
            Map.of("type", "FINE_PAID", "description", "Fine payment of $15.50 received from Mike Johnson", "timestamp", LocalDateTime.now().minusHours(6)),
            Map.of("type", "NEW_MEMBER", "description", "New member Sarah Wilson registered", "timestamp", LocalDateTime.now().minusHours(8)),
            Map.of("type", "BOOK_REQUEST", "description", "Book request for 'To Kill a Mockingbird' submitted", "timestamp", LocalDateTime.now().minusHours(10))
        );
    }

    public Map<String, Object> getChartData() {
        Map<String, Object> chartData = new HashMap<>();
        
        // Mock transaction chart data
        List<Map<String, Object>> transactionData = Arrays.asList(
            Map.of("date", "2025-09-15", "checkouts", 5, "returns", 3),
            Map.of("date", "2025-09-16", "checkouts", 8, "returns", 6),
            Map.of("date", "2025-09-17", "checkouts", 3, "returns", 7),
            Map.of("date", "2025-09-18", "checkouts", 6, "returns", 4),
            Map.of("date", "2025-09-19", "checkouts", 9, "returns", 8),
            Map.of("date", "2025-09-20", "checkouts", 4, "returns", 5),
            Map.of("date", "2025-09-21", "checkouts", 7, "returns", 6)
        );
        chartData.put("transactionData", transactionData);
        
        // Mock user registration chart data
        List<Map<String, Object>> userRegistrationData = Arrays.asList(
            Map.of("date", "2025-09-15", "registrations", 2),
            Map.of("date", "2025-09-16", "registrations", 1),
            Map.of("date", "2025-09-17", "registrations", 3),
            Map.of("date", "2025-09-18", "registrations", 0),
            Map.of("date", "2025-09-19", "registrations", 2),
            Map.of("date", "2025-09-20", "registrations", 1),
            Map.of("date", "2025-09-21", "registrations", 1)
        );
        chartData.put("userRegistrationData", userRegistrationData);
        
        // Mock fine collection chart data
        List<Map<String, Object>> fineData = Arrays.asList(
            Map.of("date", "2025-09-15", "amount", 25.50),
            Map.of("date", "2025-09-16", "amount", 15.75),
            Map.of("date", "2025-09-17", "amount", 30.00),
            Map.of("date", "2025-09-18", "amount", 12.25),
            Map.of("date", "2025-09-19", "amount", 18.50),
            Map.of("date", "2025-09-20", "amount", 22.75),
            Map.of("date", "2025-09-21", "amount", 16.25)
        );
        chartData.put("fineData", fineData);
        
        return chartData;
    }
}