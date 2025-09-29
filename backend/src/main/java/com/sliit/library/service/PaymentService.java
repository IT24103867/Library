package com.sliit.library.service;

import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ForbiddenException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final FineService fineService;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final ObjectMapper objectMapper;

    @Value("${payhere.merchant.id:1210000}")
    private String merchantId;

    @Value("${payhere.merchant.secret:ODUzNzY4MzA2MjA5ODUwMzY4ODg2MzY5ODIzODAzMzAzNjE5}")
    private String merchantSecret;

    @Value("${payhere.return.url:http://localhost:3000/fines?payment=success}")
    private String returnUrl;

    @Value("${payhere.cancel.url:http://localhost:3000/fines?payment=cancelled}")
    private String cancelUrl;

    @Value("${payhere.notify.url:http://localhost:8080/api/payments/notify}")
    private String notifyUrl;

    @Value("${payhere.sandbox.url:https://sandbox.payhere.lk/pay/checkout}")
    private String payHereUrl;

    @Value("${payhere.currency:LKR}")
    private String currency;

    @Transactional
    public Payment initiatePayment(User user, Fine fine, PaymentMethod method) {
        // Create payment record
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setFine(fine);
        payment.setAmount(fine.getRemainingAmount());
        payment.setType(getPaymentTypeFromFineType(fine.getType()));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setMethod(method);
        payment.setOrderID(generateOrderId());
        payment.setMerchantID(merchantId);
        payment.setDescription("Library fine payment for " + fine.getDescription());

        Payment savedPayment = paymentRepository.save(payment);

        // Log activity
        activityService.logActivity(user, ActivityType.PAYMENT_INITIATED, 
            "Payment initiated: $" + payment.getAmount(), 
            null, null, null, fine.getId());

        return savedPayment;
    }

    private PaymentType getPaymentTypeFromFineType(FineType fineType) {
        return switch (fineType) {
            case OVERDUE -> PaymentType.OVERDUE_CHARGE;
            case LOST -> PaymentType.LOST_BOOK_CHARGE;
            case DAMAGED -> PaymentType.DAMAGED_BOOK_CHARGE;
            case LATE_RETURN -> PaymentType.LATE_RETURN_CHARGE;
            case OTHER -> PaymentType.OTHER;
        };
    }

    // Migrate old FINE_PAYMENT records to specific types
    @Transactional
    public void migrateOldPaymentTypes() {
        List<Payment> oldPayments = paymentRepository.findByType(PaymentType.FINE_PAYMENT);
        for (Payment payment : oldPayments) {
            if (payment.getFine() != null) {
                PaymentType newType = getPaymentTypeFromFineType(payment.getFine().getType());
                payment.setType(newType);
                paymentRepository.save(payment);
                log.info("Migrated payment {} from FINE_PAYMENT to {}", payment.getId(), newType);
            } else {
                // If no fine is associated, set to OTHER
                payment.setType(PaymentType.OTHER);
                paymentRepository.save(payment);
                log.info("Migrated payment {} from FINE_PAYMENT to OTHER (no fine associated)", payment.getId());
            }
        }
    }

    public Map<String, Object> generatePayHereData(Payment payment) {
        try {
            Map<String, Object> paymentData = new java.util.HashMap<>();
            paymentData.put("merchant_id", merchantId);
            paymentData.put("return_url", returnUrl);
            paymentData.put("cancel_url", cancelUrl);
            paymentData.put("notify_url", notifyUrl);
            paymentData.put("order_id", payment.getOrderID());
            paymentData.put("items", payment.getDescription());
            paymentData.put("currency", currency);
            paymentData.put("amount", String.format("%.2f", payment.getAmount()));
            paymentData.put("first_name", payment.getUser().getName());
            paymentData.put("last_name", "");
            paymentData.put("email", payment.getUser().getEmail());
            paymentData.put("phone", "");
            paymentData.put("address", "");
            paymentData.put("city", "");
            paymentData.put("country", "Sri Lanka");

            // Generate hash
            String hash = generatePayHereHash(paymentData);
            paymentData.put("hash", hash);

            return paymentData;
        } catch (Exception e) {
            log.error("Error generating PayHere data", e);
            throw new BusinessException("Failed to generate payment data");
        }
    }

    private String generatePayHereHash(Map<String, Object> data) throws Exception {
        // PayHere hash generation: md5(merchant_id + order_id + amount + currency + md5(merchant_secret).toUpperCase())
        String hashString = merchantId +
            data.get("order_id") +
            data.get("amount") +
            data.get("currency") +
            getMD5Hash(merchantSecret).toUpperCase();

        return getMD5Hash(hashString).toUpperCase();
    }

    private String getMD5Hash(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] messageDigest = md.digest(input.getBytes());
        StringBuilder hexString = new StringBuilder();

        for (byte b : messageDigest) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }

        return hexString.toString().toUpperCase();
    }

    @Transactional
    public void handlePayHereNotification(Map<String, String> params) {
        log.info("Received PayHere notification: {}", params);

        try {
            String orderID = params.get("order_id");
            String paymentID = params.get("payment_id");
            String statusCode = params.get("status_code");
            String md5sig = params.get("md5sig");

            log.info("Processing payment notification - OrderID: {}, Status: {}", orderID, statusCode);

            Payment payment = paymentRepository.findByOrderID(orderID)
                .orElseThrow(() -> new RuntimeException("Payment not found for order ID: " + orderID));

            // Verify hash (implement hash verification logic)
            if (!verifyPayHereHash(params, payment)) {
                log.error("Invalid hash for payment: " + orderID);
                payment.setStatus(PaymentStatus.FAILED);
                payment.setErrorMessage("Invalid payment verification");
                paymentRepository.save(payment);
                return;
            }

            payment.setPaymentID(paymentID);
            payment.setStatusCode(statusCode);
            payment.setMd5sig(md5sig);
            payment.setPayHereResponse(objectMapper.writeValueAsString(params));

            if ("2".equals(statusCode)) { // Success
                log.info("Payment successful for order: {}", orderID);
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setPaidAt(LocalDateTime.now());
                
                // Update fine
                if (payment.getFine() != null) {
                    fineService.payFine(payment.getFine().getId(), payment.getAmount(), 
                        payment.getUser(), payment.getPaymentID());
                    log.info("Fine updated for payment: {}", orderID);
                }

                // Log activity
                activityService.logActivity(payment.getUser(), ActivityType.PAYMENT_COMPLETED, 
                    "Payment completed: $" + payment.getAmount(), 
                    null, null, null, payment.getFine() != null ? payment.getFine().getId() : null);

                // Send notification
                notificationService.sendPaymentConfirmation(payment);

            } else if ("0".equals(statusCode)) { // Pending
                log.info("Payment pending for order: {}", orderID);
                payment.setStatus(PaymentStatus.PROCESSING);
            } else { // Failed or cancelled
                log.warn("Payment failed/cancelled for order: {}, status: {}", orderID, statusCode);
                payment.setStatus(PaymentStatus.FAILED);
                payment.setErrorMessage("Payment failed with status: " + statusCode);

                // Log activity
                activityService.logActivity(payment.getUser(), ActivityType.PAYMENT_FAILED, 
                    "Payment failed: $" + payment.getAmount() + " - Status: " + statusCode, 
                    null, null, null, payment.getFine() != null ? payment.getFine().getId() : null);
            }

            paymentRepository.save(payment);

        } catch (Exception e) {
            log.error("Error processing PayHere notification", e);
        }
    }

    private boolean verifyPayHereHash(Map<String, String> params, Payment payment) {
        try {
            String receivedHash = params.get("md5sig");
            String localHash = generateVerificationHash(params);
            return receivedHash != null && receivedHash.equalsIgnoreCase(localHash);
        } catch (Exception e) {
            log.error("Error verifying PayHere hash", e);
            return false;
        }
    }

    private String generateVerificationHash(Map<String, String> params) throws Exception {
        // PayHere notification verification: md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret).toUpperCase())
        String hashString = merchantId +
            params.get("order_id") +
            params.get("payhere_amount") +
            params.get("payhere_currency") +
            params.get("status_code") +
            getMD5Hash(merchantSecret).toUpperCase();

        return getMD5Hash(hashString).toUpperCase();
    }

    @Transactional
    public Payment processDirectPayment(User user, Fine fine, PaymentMethod method, String reference) {
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setFine(fine);
        payment.setAmount(fine.getRemainingAmount());
        payment.setType(getPaymentTypeFromFineType(fine.getType()));
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setMethod(method);
        payment.setOrderID(generateOrderId());
        payment.setTransactionReference(reference);
        payment.setPaidAt(LocalDateTime.now());
        payment.setDescription("Direct payment for " + fine.getDescription());

        Payment savedPayment = paymentRepository.save(payment);

        // Update fine
        fineService.payFine(fine.getId(), payment.getAmount(), user, reference);

        // Log activity
        activityService.logActivity(user, ActivityType.PAYMENT_COMPLETED, 
            "Direct payment completed: $" + payment.getAmount(), 
            null, null, null, fine.getId());

        // Send notification
        notificationService.sendPaymentConfirmation(savedPayment);

        return savedPayment;
    }

    private String generateOrderId() {
        return "LIB" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public List<Payment> getUserPayments(User user) {
        return paymentRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Payment> getUserPayments(Long userId) {
        User user = new User();
        user.setId(userId);
        return getUserPayments(user);
    }

    public List<Payment> getPaymentsByStatus(PaymentStatus status) {
        return paymentRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    public List<Payment> getPaymentsByUserAndStatus(Long userId, PaymentStatus status) {
        return paymentRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByCreatedAtDesc();
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    public Payment getPaymentByOrderId(String orderId) {
        return paymentRepository.findByOrderID(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
    }

    @Transactional
    public void cancelPayment(Long paymentId, User user) {
        Payment payment = getPaymentById(paymentId);

        if (!payment.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only cancel your own payments");
        }

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new BusinessException("Only pending payments can be cancelled");
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setCancelledAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // Log activity
        activityService.logActivity(user, ActivityType.PAYMENT_FAILED, 
            "Payment cancelled: $" + payment.getAmount(), 
            null, null, null, payment.getFine() != null ? payment.getFine().getId() : null);
    }

    @Transactional
    public Payment createPayment(User user, Long fineId, Double amount, PaymentMethod method) {
        Fine fine = fineService.getFineById(fineId);
        
        if (!fine.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only create payments for your own fines");
        }
        
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setFine(fine);
        payment.setAmount(amount);
        payment.setMethod(method);
        payment.setType(getPaymentTypeFromFineType(fine.getType()));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        
        return paymentRepository.save(payment);
    }

    @Transactional
    public void verifyAndCompletePayment(String orderId) {
        Payment payment = getPaymentByOrderId(orderId);
        
        if (payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);
            
            // Mark the fine as paid
            fineService.payFine(payment.getFine().getId(), payment.getAmount(), payment.getUser(), "PayHere-" + orderId);
            
            // Log activity
            activityService.log(payment.getUser(), ActivityType.PAYMENT_COMPLETED, 
                "Payment completed for fine: " + payment.getFine().getId());
        }
    }

    @Transactional
    public void refundPayment(Long paymentId, User refundedBy, String reason) {
        Payment payment = getPaymentById(paymentId);
        
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new BusinessException("Only completed payments can be refunded");
        }
        
        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);
        
        // Log activity
        activityService.log(refundedBy, ActivityType.FINE_WAIVED, 
            "Payment refunded: " + payment.getId() + ". Reason: " + reason);
    }

    @Transactional
    public void cleanupExpiredPayments() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(2); // 2 hours timeout
        List<Payment> expiredPayments = paymentRepository.findExpiredPendingPayments(cutoffTime);
        
        for (Payment payment : expiredPayments) {
            payment.setStatus(PaymentStatus.CANCELLED);
            payment.setErrorMessage("Payment expired");
            paymentRepository.save(payment);
        }
    }

    public Double getTotalPayments(LocalDateTime startDate, LocalDateTime endDate) {
        Double total = paymentRepository.getTotalPaymentsBetween(startDate, endDate);
        return total != null ? total : 0.0;
    }

    public long getTotalPaymentCount() {
        return paymentRepository.count();
    }

    public long getPaymentsCountByStatus(PaymentStatus status) {
        return paymentRepository.countByStatus(status);
    }

    public Map<String, Object> getPaymentStatistics() {
        long totalPayments = getTotalPaymentCount();
        long pendingPayments = getPaymentsCountByStatus(PaymentStatus.PENDING);
        long completedPayments = getPaymentsCountByStatus(PaymentStatus.COMPLETED);
        long failedPayments = getPaymentsCountByStatus(PaymentStatus.FAILED);
        Double totalAmount = paymentRepository.getTotalAmount();

        return Map.of(
            "totalPayments", totalPayments,
            "totalAmount", totalAmount != null ? totalAmount : 0.0,
            "pendingPayments", pendingPayments,
            "completedPayments", completedPayments,
            "failedPayments", failedPayments
        );
    }
}
