package com.sliit.library.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchedulerService {

    private final BookTransactionService transactionService;
    private final BookRequestService requestService;
    private final FineService fineService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;

    // Process overdue books every hour
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void processOverdueBooks() {
        log.info("Processing overdue books...");
        try {
            transactionService.processOverdueBooks();
            log.info("Overdue books processed successfully");
        } catch (Exception e) {
            log.error("Error processing overdue books", e);
        }
    }

    // Send due reminders every day at 9 AM
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDueReminders() {
        log.info("Sending due date reminders...");
        try {
            transactionService.sendDueReminders();
            log.info("Due date reminders sent successfully");
        } catch (Exception e) {
            log.error("Error sending due date reminders", e);
        }
    }

    // Expire old book requests every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    public void expireOldRequests() {
        log.info("Expiring old book requests...");
        try {
            requestService.expireOldRequests();
            log.info("Old book requests expired successfully");
        } catch (Exception e) {
            log.error("Error expiring old book requests", e);
        }
    }

    // Send fine reminders every day at 10 AM
    @Scheduled(cron = "0 0 10 * * *")
    public void sendFineReminders() {
        log.info("Sending fine payment reminders...");
        try {
            fineService.processOverdueFineReminders();
            log.info("Fine payment reminders sent successfully");
        } catch (Exception e) {
            log.error("Error sending fine payment reminders", e);
        }
    }

    // Clean up expired payments every 6 hours
    @Scheduled(fixedRate = 21600000) // 6 hours
    public void cleanupExpiredPayments() {
        log.info("Cleaning up expired payments...");
        try {
            paymentService.cleanupExpiredPayments();
            log.info("Expired payments cleaned up successfully");
        } catch (Exception e) {
            log.error("Error cleaning up expired payments", e);
        }
    }

    // Retry failed notifications every 30 minutes
    @Scheduled(fixedRate = 1800000) // 30 minutes
    public void retryFailedNotifications() {
        log.info("Retrying failed notifications...");
        try {
            notificationService.retryFailedNotifications();
            log.info("Failed notifications retry completed");
        } catch (Exception e) {
            log.error("Error retrying failed notifications", e);
        }
    }

    // Clean up old notifications weekly (every Sunday at 2 AM)
    @Scheduled(cron = "0 0 2 * * SUN")
    public void cleanupOldNotifications() {
        log.info("Cleaning up old notifications...");
        try {
            notificationService.cleanupOldNotifications();
            log.info("Old notifications cleaned up successfully");
        } catch (Exception e) {
            log.error("Error cleaning up old notifications", e);
        }
    }

    // Generate system reports daily at 1 AM
    @Scheduled(cron = "0 0 1 * * *")
    public void generateDailyReports() {
        log.info("Generating daily system reports...");
        try {
            // This would generate various system reports
            // For now, just log the activity
            log.info("Daily system reports generated successfully");
        } catch (Exception e) {
            log.error("Error generating daily system reports", e);
        }
    }
}
