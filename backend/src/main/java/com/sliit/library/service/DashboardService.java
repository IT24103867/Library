package com.sliit.library.service;

import com.sliit.library.model.*;
import com.sliit.library.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final BookTransactionRepository bookTransactionRepository;
    private final BookRequestRepository bookRequestRepository;
    private final FineRepository fineRepository;
    private final ActivityRepository activityRepository;
    private final BookCopyRepository bookCopyRepository;
    private final CategoryRepository categoryRepository;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final RequestMetricsService requestMetricsService;

    // Admin Dashboard Methods
    public Map<String, Object> getAdminDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Summary Section
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalUsers", userRepository.count());
        summary.put("totalBooks", bookRepository.count());
        summary.put("totalBookCopies", bookCopyRepository.count());
        summary.put("totalCategories", categoryRepository.count());
        summary.put("totalAuthors", authorRepository.count());
        summary.put("totalPublishers", publisherRepository.count());
        summary.put("totalLanguages", 4); // Hardcoded for now, can be made dynamic
        summary.put("totalTransactions", bookTransactionRepository.count());
        summary.put("activeLoans", bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE));
        summary.put("availableBooks", bookCopyRepository.findByStatus(BookStatus.AVAILABLE).size());
        stats.put("summary", summary);

        // User Breakdown
        Map<String, Object> userBreakdown = new HashMap<>();
        userBreakdown.put("admins", userRepository.countByRole(UserRole.ADMIN));
        userBreakdown.put("librarians", userRepository.countByRole(UserRole.LIBRARIAN));
        userBreakdown.put("members", userRepository.countByRole(UserRole.MEMBER));
        userBreakdown.put("activeUsers", userRepository.count()); // Simplified
        userBreakdown.put("inactiveUsers", 0); // Simplified
        userBreakdown.put("newUsersThisMonth", 0); // Simplified
        userBreakdown.put("usersWithFines", 0); // Simplified - would need proper query
        stats.put("userBreakdown", userBreakdown);

        // Book Statistics
        Map<String, Object> bookStatistics = new HashMap<>();
        bookStatistics.put("booksByStatus", getBooksByStatus());
        bookStatistics.put("booksByLanguage", getBooksByLanguage());
        bookStatistics.put("booksByCategory", getBooksByCategory());
        bookStatistics.put("recentlyAddedBooks", 0); // Simplified
        bookStatistics.put("booksAddedThisMonth", 0); // Simplified
        bookStatistics.put("mostPopularBooks", List.of()); // Simplified
        stats.put("bookStatistics", bookStatistics);

        // Transaction Statistics
        Map<String, Object> transactionStatistics = new HashMap<>();
        transactionStatistics.put("totalTransactions", bookTransactionRepository.count());
        transactionStatistics.put("activeTransactions", bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE));
        transactionStatistics.put("completedTransactions", bookTransactionRepository.countByStatus(TransactionStatus.RETURNED));
        transactionStatistics.put("overdueTransactions", bookTransactionRepository.countByStatus(TransactionStatus.OVERDUE));
        transactionStatistics.put("pendingRequests", 0); // Simplified
        transactionStatistics.put("transactionsThisMonth", 0); // Simplified
        transactionStatistics.put("transactionsThisWeek", 0); // Simplified
        transactionStatistics.put("averageLoanDuration", 14.0); // Simplified
        stats.put("transactionStatistics", transactionStatistics);

        // Financial Statistics
        Map<String, Object> financialStatistics = new HashMap<>();

        // Calculate total fines (sum of all fine amounts)
        Double totalFines = fineRepository.findAll().stream()
                .mapToDouble(Fine::getAmount)
                .sum();
        financialStatistics.put("totalFines", totalFines);

        // Calculate outstanding fines (unpaid amounts)
        Double outstandingFines = fineRepository.sumOfPendingFines();
        financialStatistics.put("outstandingFines", outstandingFines);

        // Calculate collected fines (sum of paid amounts)
        Double collectedFines = fineRepository.findAll().stream()
                .filter(fine -> fine.getStatus() == FineStatus.PAID || fine.getStatus() == FineStatus.PARTIALLY_PAID)
                .mapToDouble(Fine::getPaidAmount)
                .sum();
        financialStatistics.put("collectedFines", collectedFines);

        // Calculate fines this month
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        Double finesThisMonth = fineRepository.findAll().stream()
                .filter(fine -> fine.getCreatedAt().isAfter(startOfMonth))
                .mapToDouble(Fine::getAmount)
                .sum();
        financialStatistics.put("finesThisMonth", finesThisMonth);

        // Calculate average fine amount
        List<Fine> allFines = fineRepository.findAll();
        Double averageFineAmount = allFines.isEmpty() ? 0.0 :
                allFines.stream().mapToDouble(Fine::getAmount).average().orElse(0.0);
        financialStatistics.put("averageFineAmount", averageFineAmount);

        // Total revenue (for now, just collected fines + any other revenue sources)
        // TODO: Add membership fees, etc. when implemented
        financialStatistics.put("totalRevenue", collectedFines);

        stats.put("financialStatistics", financialStatistics);

        // Activity Metrics
        Map<String, Object> activityMetrics = new HashMap<>();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(now.getDayOfWeek().getValue() - 1).toLocalDate().atStartOfDay();
        // startOfMonth already declared above in financial statistics section

        // Books issued today
        long booksIssuedToday = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getIssuedAt() != null && t.getIssuedAt().isAfter(startOfToday))
                .count();
        activityMetrics.put("booksIssuedToday", (int) booksIssuedToday);

        // Books returned today
        long booksReturnedToday = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getReturnedAt() != null && t.getReturnedAt().isAfter(startOfToday))
                .count();
        activityMetrics.put("booksReturnedToday", (int) booksReturnedToday);

        // Books issued this week
        long booksIssuedThisWeek = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getIssuedAt() != null && t.getIssuedAt().isAfter(startOfWeek))
                .count();
        activityMetrics.put("booksIssuedThisWeek", (int) booksIssuedThisWeek);

        // Books returned this week
        long booksReturnedThisWeek = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getReturnedAt() != null && t.getReturnedAt().isAfter(startOfWeek))
                .count();
        activityMetrics.put("booksReturnedThisWeek", (int) booksReturnedThisWeek);

        // Books issued this month
        long booksIssuedThisMonth = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getIssuedAt() != null && t.getIssuedAt().isAfter(startOfMonth))
                .count();
        activityMetrics.put("booksIssuedThisMonth", (int) booksIssuedThisMonth);

        // Books returned this month
        long booksReturnedThisMonth = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getReturnedAt() != null && t.getReturnedAt().isAfter(startOfMonth))
                .count();
        activityMetrics.put("booksReturnedThisMonth", (int) booksReturnedThisMonth);

        activityMetrics.put("overdueItems", bookTransactionRepository.countByStatus(TransactionStatus.OVERDUE));

        // Items due today
        LocalDateTime endOfToday = startOfToday.plusDays(1).minusSeconds(1);
        long itemsDueToday = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getDueDate() != null &&
                           t.getDueDate().isAfter(startOfToday) &&
                           t.getDueDate().isBefore(endOfToday) &&
                           t.getStatus() == TransactionStatus.ACTIVE)
                .count();
        activityMetrics.put("itemsDueToday", (int) itemsDueToday);

        // Items due this week
        LocalDateTime endOfWeek = startOfWeek.plusDays(7).minusSeconds(1);
        long itemsDueThisWeek = bookTransactionRepository.findAll().stream()
                .filter(t -> t.getDueDate() != null &&
                           t.getDueDate().isAfter(now) &&
                           t.getDueDate().isBefore(endOfWeek) &&
                           t.getStatus() == TransactionStatus.ACTIVE)
                .count();
        activityMetrics.put("itemsDueThisWeek", (int) itemsDueThisWeek);

        stats.put("activityMetrics", activityMetrics);

        // System Health
        Map<String, Object> systemHealth = new HashMap<>();
        systemHealth.put("databaseSize", "15.2 MB"); // Placeholder
        systemHealth.put("lastBackup", LocalDateTime.now().minusDays(1));
        systemHealth.put("activeSessions", 1); // Simplified
        systemHealth.put("apiRequestsToday", requestMetricsService.getRequestsToday());
        systemHealth.put("errorRate", requestMetricsService.getErrorRateToday());
        stats.put("systemHealth", systemHealth);

        // Trends
        Map<String, Object> trends = new HashMap<>();
        trends.put("monthlyLoans", List.of()); // Simplified
        trends.put("dailyActivity", List.of()); // Simplified
        stats.put("trends", trends);

        // Top Entities
        Map<String, Object> topEntities = new HashMap<>();
        topEntities.put("topAuthors", getTopAuthors(5));
        topEntities.put("topPublishers", getTopPublishers(5));
        topEntities.put("topCategories", getTopCategories(5));
        topEntities.put("mostActiveMembers", List.of()); // Simplified
        stats.put("topEntities", topEntities);

        // Alerts
        Map<String, Object> alerts = new HashMap<>();
        alerts.put("criticalAlerts", getCriticalAlerts());
        alerts.put("warnings", getWarnings());
        alerts.put("notifications", List.of()); // Simplified
        stats.put("alerts", alerts);

        stats.put("generatedAt", LocalDateTime.now());

        return stats;
    }

    public Map<String, Object> getAdminOverview() {
        Map<String, Object> overview = new HashMap<>();

        // Recent activity summary (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        long newUsers = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.USER_CREATED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        long booksIssued = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_ISSUED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        long booksReturned = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_RETURNED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(weekAgo))
            .count();

        overview.put("newUsersThisWeek", newUsers);
        overview.put("booksIssuedThisWeek", booksIssued);
        overview.put("booksReturnedThisWeek", booksReturned);

        return overview;
    }

    public Map<String, Object> getFinancialStats() {
        Map<String, Object> financial = new HashMap<>();

        // Fine statistics
        double totalCollected = 0.0; // Would need payment history
        double outstandingFines = fineRepository.sumOfPendingFines();
        long totalFines = fineRepository.count();

        financial.put("totalCollected", totalCollected);
        financial.put("outstandingFines", outstandingFines);
        financial.put("totalFines", totalFines);

        return financial;
    }

    public Map<String, Object> getUserManagementStats() {
        Map<String, Object> userStats = new HashMap<>();

        // User role distribution
        long totalUsers = userRepository.count();
        long adminUsers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.ADMIN)
            .count();
        long librarianUsers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.LIBRARIAN)
            .count();
        long memberUsers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == UserRole.MEMBER)
            .count();

        userStats.put("totalUsers", totalUsers);
        userStats.put("adminUsers", adminUsers);
        userStats.put("librarianUsers", librarianUsers);
        userStats.put("memberUsers", memberUsers);

        return userStats;
    }

    // Librarian Dashboard Methods
    public Map<String, Object> getLibrarianDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Circulation stats
        long activeTransactions = bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE);
        long overdueTransactions = bookTransactionRepository.findOverdueTransactions(LocalDateTime.now()).size();
        long pendingRequests = bookRequestRepository.countByStatus(RequestStatus.PENDING);

        stats.put("activeLoans", activeTransactions);
        stats.put("overdueItems", overdueTransactions);
        stats.put("pendingRequests", pendingRequests);

        // Today's activity
        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime tomorrow = today.plusDays(1);

        long booksIssuedToday = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_ISSUED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(today) && a.getTimestamp().isBefore(tomorrow))
            .count();

        long booksReturnedToday = activityRepository.findByTypeOrderByTimestampDesc(ActivityType.BOOK_RETURNED)
            .stream()
            .filter(a -> a.getTimestamp().isAfter(today) && a.getTimestamp().isBefore(tomorrow))
            .count();

        stats.put("booksIssuedToday", booksIssuedToday);
        stats.put("booksReturnedToday", booksReturnedToday);

        return stats;
    }

    public Map<String, Object> getCirculationStats() {
        Map<String, Object> circulation = new HashMap<>();

        // Current circulation
        long activeLoans = bookTransactionRepository.countByStatus(TransactionStatus.ACTIVE);
        long availableBooks = bookCopyRepository.findByStatus(BookStatus.AVAILABLE).size();
        long totalCopies = bookCopyRepository.count();

        circulation.put("activeLoans", activeLoans);
        circulation.put("availableBooks", availableBooks);
        circulation.put("totalCopies", totalCopies);
        circulation.put("utilizationRate", totalCopies > 0 ? (double) activeLoans / totalCopies : 0.0);

        return circulation;
    }

    public Map<String, Object> getOverdueItems() {
        Map<String, Object> overdue = new HashMap<>();

        List<BookTransaction> overdueTransactions = bookTransactionRepository.findOverdueTransactions(LocalDateTime.now());
        long overdueCount = overdueTransactions.size();

        // Calculate total overdue fines
        double totalOverdueFines = overdueTransactions.stream()
            .mapToDouble(BookTransaction::getFineAmount)
            .sum();

        overdue.put("overdueCount", overdueCount);
        overdue.put("totalOverdueFines", totalOverdueFines);
        overdue.put("overdueItems", overdueTransactions.stream()
            .map(this::mapTransactionToOverdueItem)
            .collect(Collectors.toList()));

        return overdue;
    }

    public Map<String, Object> getPendingRequests() {
        Map<String, Object> requests = new HashMap<>();

        List<BookRequest> pendingRequests = bookRequestRepository.findAllPendingRequests();
        long pendingCount = pendingRequests.size();

        requests.put("pendingCount", pendingCount);
        requests.put("pendingRequests", pendingRequests.stream()
            .map(this::mapRequestToPendingItem)
            .collect(Collectors.toList()));

        return requests;
    }

    public Map<String, Object> getRecentActivity(int limit) {
        Map<String, Object> activity = new HashMap<>();

        List<Activity> recentActivities = activityRepository.findAll()
            .stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .limit(limit)
            .collect(Collectors.toList());

        activity.put("recentActivities", recentActivities.stream()
            .map(this::mapActivityToSummary)
            .collect(Collectors.toList()));

        return activity;
    }

    // Helper methods
    private Map<String, Object> mapTransactionToOverdueItem(BookTransaction transaction) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", transaction.getId());
        item.put("bookTitle", transaction.getBookCopy().getBook().getTitle());
        item.put("userName", transaction.getUser().getName());
        item.put("dueDate", transaction.getDueDate());
        item.put("daysOverdue", java.time.temporal.ChronoUnit.DAYS.between(transaction.getDueDate(), LocalDateTime.now()));
        item.put("fineAmount", transaction.getFineAmount());
        return item;
    }

    private Map<String, Object> mapRequestToPendingItem(BookRequest request) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", request.getId());
        item.put("bookTitle", request.getBook().getTitle());
        item.put("userName", request.getUser().getName());
        item.put("requestDate", request.getRequestedAt());
        item.put("queuePosition", 0); // Would need to calculate queue position
        return item;
    }

    private Map<String, Object> mapActivityToSummary(Activity activity) {
        Map<String, Object> summary = new HashMap<>();
        summary.put("id", activity.getId());
        summary.put("type", activity.getType());
        summary.put("description", activity.getMessage());
        summary.put("timestamp", activity.getTimestamp());
        summary.put("user", activity.getUser() != null ? activity.getUser().getName() : "System");
        return summary;
    }

    // Helper methods for comprehensive stats
    private Map<String, Long> getBooksByStatus() {
        Map<String, Long> booksByStatus = new HashMap<>();
        for (BookStatus status : BookStatus.values()) {
            booksByStatus.put(status.name().toLowerCase(), (long) bookCopyRepository.findByStatus(status).size());
        }
        return booksByStatus;
    }

    private Map<String, Long> getBooksByLanguage() {
        // Simplified - would need Language entity and relationship
        Map<String, Long> booksByLanguage = new HashMap<>();
        booksByLanguage.put("English", 0L);
        booksByLanguage.put("Sinhala", 0L);
        booksByLanguage.put("Tamil", 0L);
        booksByLanguage.put("Other", 0L);
        return booksByLanguage;
    }

    private Map<String, Long> getBooksByCategory() {
        Map<String, Long> booksByCategory = new HashMap<>();
        List<Category> categories = categoryRepository.findAll();
        for (Category category : categories) {
            // Simplified - would need proper relationship
            booksByCategory.put(category.getName(), 0L);
        }
        return booksByCategory;
    }

    private List<Map<String, Object>> getTopAuthors(int limit) {
        // Simplified - would need proper query
        return List.of();
    }

    private List<Map<String, Object>> getTopPublishers(int limit) {
        // Simplified - would need proper query
        return List.of();
    }

    private List<Map<String, Object>> getTopCategories(int limit) {
        // Simplified - would need proper query
        return List.of();
    }

    private List<Map<String, Object>> getCriticalAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        long overdueCount = bookTransactionRepository.countByStatus(TransactionStatus.OVERDUE);
        if (overdueCount > 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("type", "overdue");
            alert.put("message", overdueCount + " books are overdue");
            alert.put("count", overdueCount);
            alerts.add(alert);
        }
        return alerts;
    }

    private List<Map<String, Object>> getWarnings() {
        List<Map<String, Object>> warnings = new ArrayList<>();
        // Add low stock warnings, etc.
        return warnings;
    }
}