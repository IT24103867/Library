package com.sliit.library.service;

import com.sliit.library.dto.NotificationDto;
import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ForbiddenException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final LibraryPolicyService policyService;
    
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private WebSocketNotificationService webSocketService;

    public NotificationService(NotificationRepository notificationRepository, LibraryPolicyService policyService) {
        this.notificationRepository = notificationRepository;
        this.policyService = policyService;
    }

    @Transactional
    public Notification createNotification(User user, NotificationType type, String subject, 
                                         String message, NotificationChannel channel) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setSubject(subject);
        notification.setMessage(message);
        notification.setChannel(channel);
        notification.setStatus(NotificationStatus.PENDING);
        
        return notificationRepository.save(notification);
    }

    @Transactional
    public void sendNotification(Notification notification) {
        try {
            switch (notification.getChannel()) {
                case EMAIL:
                    sendEmailNotification(notification);
                    break;
                case SMS:
                    sendSMSNotification(notification);
                    break;
                case IN_APP:
                    // For in-app notifications, mark as sent and send via WebSocket
                    notification.setStatus(NotificationStatus.SENT);
                    // Send real-time notification via WebSocket
                    if (webSocketService != null) {
                        webSocketService.sendNotificationToUser(notification.getUser().getId(), notification);
                    }
                    break;
                default:
                    throw new BusinessException("Unsupported notification channel: " + notification.getChannel());
            }
            
            notification.setSentAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
        } catch (Exception e) {
            log.error("Failed to send notification: " + e.getMessage(), e);
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            notification.setRetryCount(notification.getRetryCount() + 1);
            notificationRepository.save(notification);
        }
    }

    private void sendEmailNotification(Notification notification) {
        LibraryPolicy policy = policyService.getActivePolicy();
        if (!policy.getEmailNotifications()) {
            log.info("Email notifications are disabled");
            return;
        }

        if (mailSender == null) {
            log.warn("JavaMailSender not available, skipping email notification");
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage("Email service not configured");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(notification.getUser().getEmail());
            message.setSubject(notification.getSubject());
            message.setText(notification.getMessage());
            message.setFrom("noreply@library.com");

            mailSender.send(message);
            notification.setStatus(NotificationStatus.SENT);
            
        } catch (Exception e) {
            log.error("Failed to send email notification", e);
            notification.setStatus(NotificationStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            // Don't throw the exception - let the calling method handle it
        }
    }

    private void sendSMSNotification(Notification notification) {
        LibraryPolicy policy = policyService.getActivePolicy();
        if (!policy.getSmsNotifications()) {
            log.info("SMS notifications are disabled");
            return;
        }
        
        // SMS implementation would go here
        // For now, just mark as sent
        notification.setStatus(NotificationStatus.SENT);
        log.info("SMS notification sent to user: " + notification.getUser().getUsername());
    }

    public void sendBookRequestConfirmation(BookRequest request) {
        String subject = "Book Request Confirmation";
        String message = String.format(
            "Dear %s,\n\nYour request for the book '%s' has been confirmed.\n" +
            "Queue position: %d\n" +
            "Request will expire on: %s\n\n" +
            "Thank you for using our library service.",
            request.getUser().getName(),
            request.getBook().getTitle(),
            request.getQueuePosition(),
            request.getExpiresAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        );
        
        Notification notification = createNotification(request.getUser(),
            NotificationType.BOOK_REQUEST_CONFIRMED, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookRequestCancellation(BookRequest request) {
        String subject = "Book Request Cancelled";
        String message = String.format(
            "Dear %s,\n\nYour request for the book '%s' has been cancelled.\n\n" +
            "If this was not intentional, please contact the library.\n\n" +
            "Thank you for using our library service.",
            request.getUser().getName(),
            request.getBook().getTitle()
        );
        
        Notification notification = createNotification(request.getUser(), 
            NotificationType.BOOK_REQUEST_CANCELLED, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookRequestFulfillment(BookRequest request) {
        String subject = "Book Available - Your Request is Ready";
        String message = String.format(
            "Dear %s,\n\nGreat news! The book '%s' you requested is now available.\n\n" +
            "Please visit the library to check out your book within the next 3 days.\n\n" +
            "Thank you for using our library service.",
            request.getUser().getName(),
            request.getBook().getTitle()
        );
        
        Notification notification = createNotification(request.getUser(), 
            NotificationType.BOOK_AVAILABLE, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookIssueConfirmation(BookTransaction transaction) {
        String subject = "Book Checked Out Successfully";
        String message = String.format(
            "Dear %s,\n\nYou have successfully checked out the book '%s'.\n\n" +
            "Due date: %s\n" +
            "Renewals allowed: %d\n\n" +
            "Please return the book on time to avoid fines.\n\n" +
            "Thank you for using our library service.",
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
            transaction.getMaxRenewals()
        );
        
        Notification notification = createNotification(transaction.getUser(), 
            NotificationType.RENEWAL_CONFIRMATION, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookReturnConfirmation(BookTransaction transaction) {
        String subject = "Book Returned Successfully";
        String message = String.format(
            "Dear %s,\n\nYou have successfully returned the book '%s'.\n\n" +
            "Return date: %s\n\n" +
            "Thank you for using our library service.",
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getReturnedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        );
        
        Notification notification = createNotification(transaction.getUser(), 
            NotificationType.RENEWAL_CONFIRMATION, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookRenewalConfirmation(BookTransaction transaction) {
        String subject = "Book Renewal Confirmation";
        String message = String.format(
            "Dear %s,\n\nYour book '%s' has been renewed successfully.\n\n" +
            "New due date: %s\n" +
            "Renewals used: %d/%d\n\n" +
            "Thank you for using our library service.",
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
            transaction.getRenewalCount(),
            transaction.getMaxRenewals()
        );
        
        Notification notification = createNotification(transaction.getUser(), 
            NotificationType.RENEWAL_CONFIRMATION, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendOverdueNotification(BookTransaction transaction) {
        String subject = "Overdue Book Notice";
        String message = String.format(
            "Dear %s,\n\nThe book '%s' is overdue.\n\n" +
            "Due date was: %s\n" +
            "Days overdue: %d\n" +
            "Fine amount: $%.2f\n\n" +
            "Please return the book as soon as possible to avoid additional fines.\n\n" +
            "Thank you for using our library service.",
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
            transaction.getOverdueDays(),
            transaction.getFineAmount()
        );
        
        Notification notification = createNotification(transaction.getUser(), 
            NotificationType.BOOK_OVERDUE, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendFineNotification(Fine fine) {
        String subject = "Fine Notice";
        String message = String.format(
            "Dear %s,\n\nA fine has been applied to your account.\n\n" +
            "Fine type: %s\n" +
            "Amount: $%.2f\n" +
            "Description: %s\n" +
            "Due date: %s\n\n" +
            "Please pay the fine by the due date.\n\n" +
            "Thank you for using our library service.",
            fine.getUser().getName(),
            fine.getType().toString().replace("_", " "),
            fine.getAmount(),
            fine.getDescription(),
            fine.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
        );
        
        Notification notification = createNotification(fine.getUser(), 
            NotificationType.FINE_NOTICE, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendPaymentConfirmation(Payment payment) {
        String subject = "Payment Confirmation";
        String message = String.format(
            "Dear %s,\n\nYour payment has been processed successfully.\n\n" +
            "Payment ID: %s\n" +
            "Amount: $%.2f\n" +
            "Type: %s\n" +
            "Date: %s\n\n" +
            "Thank you for using our library service.",
            payment.getUser().getName(),
            payment.getPaymentID(),
            payment.getAmount(),
            payment.getType().toString().replace("_", " "),
            payment.getPaidAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
        );
        
        Notification notification = createNotification(payment.getUser(), 
            NotificationType.PAYMENT_CONFIRMATION, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendBookDueReminder(BookTransaction transaction) {
        String subject = "Book Due Reminder";
        String message = String.format(
            "Dear %s,\n\nThis is a reminder that your book '%s' is due soon.\n\n" +
            "Due date: %s\n" +
            "Days remaining: %d\n\n" +
            "Please return the book on time to avoid fines.\n\n" +
            "Thank you for using our library service.",
            transaction.getUser().getName(),
            transaction.getBookCopy().getBook().getTitle(),
            transaction.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
            ChronoUnit.DAYS.between(LocalDateTime.now(), transaction.getDueDate())
        );
        
        Notification notification = createNotification(transaction.getUser(), 
            NotificationType.BOOK_DUE_REMINDER, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    public void sendFineReminder(Fine fine) {
        String subject = "Fine Payment Reminder";
        String message = String.format(
            "Dear %s,\n\nThis is a reminder that you have an outstanding fine.\n\n" +
            "Fine type: %s\n" +
            "Total amount: $%.2f\n" +
            "Amount paid: $%.2f\n" +
            "Remaining amount: $%.2f\n" +
            "Due date: %s\n" +
            "Description: %s\n\n" +
            "Please pay the fine by the due date to avoid additional charges.\n\n" +
            "Thank you for using our library service.",
            fine.getUser().getName(),
            fine.getType().toString().replace("_", " "),
            fine.getAmount(),
            fine.getPaidAmount(),
            fine.getRemainingAmount(),
            fine.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
            fine.getDescription()
        );
        
        Notification notification = createNotification(fine.getUser(), 
            NotificationType.FINE_NOTICE, subject, message, NotificationChannel.IN_APP);
        sendNotification(notification);
    }

    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failedNotifications = notificationRepository.findFailedNotificationsForRetry();
        for (Notification notification : failedNotifications) {
            sendNotification(notification);
        }
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only mark your own notifications as read");
        }
        
        notification.setReadAt(LocalDateTime.now());
        notificationRepository.save(notification);

        // Send updated unread count via WebSocket
        if (webSocketService != null) {
            long unreadCount = getUnreadNotificationCount(user);
            webSocketService.sendUnreadCountUpdate(user.getId(), (int) unreadCount);
        }
    }

    @Transactional
    public void markAllAsRead(User user) {
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadAtIsNull(user);
        LocalDateTime now = LocalDateTime.now();
        
        for (Notification notification : unreadNotifications) {
            notification.setReadAt(now);
        }
        
        notificationRepository.saveAll(unreadNotifications);

        // Send updated unread count via WebSocket (should be 0)
        if (webSocketService != null) {
            webSocketService.sendUnreadCountUpdate(user.getId(), 0);
        }
    }

    public List<NotificationDto> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
            .stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }

    public long getUnreadNotificationCount(User user) {
        return notificationRepository.countUnreadNotificationsByUser(user);
    }

    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90); // Keep notifications for 90 days
        List<Notification> oldNotifications = notificationRepository.findOldNotifications(cutoffDate);
        notificationRepository.deleteAll(oldNotifications);
    }

    private NotificationDto convertToDto(Notification notification) {
        return new NotificationDto(
            notification.getId(),
            notification.getType().toString(),
            notification.getSubject(),
            notification.getMessage(),
            notification.getStatus().toString(),
            notification.getChannel().toString(),
            notification.getCreatedAt(),
            notification.getReadAt(),
            notification.getUser().getId()
        );
    }
}
