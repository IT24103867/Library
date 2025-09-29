package com.sliit.library.controller;

import com.sliit.library.exception.ForbiddenException;
import com.sliit.library.model.*;
import com.sliit.library.service.PaymentService;
import com.sliit.library.service.FineService;
import com.sliit.library.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final FineService fineService;
    private final CurrentUser currentUser;

    @GetMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<Payment>> getPayments(@RequestParam(required = false) Long userId,
                                                     @RequestParam(required = false) PaymentStatus status) {
        User currentUserEntity = currentUser.require();
        
        // If user is not admin/librarian, they can only see their own payments
        if (!currentUserEntity.getRole().equals(UserRole.ADMIN) && !currentUserEntity.getRole().equals(UserRole.LIBRARIAN)) {
            userId = currentUserEntity.getId();
        }
        
        List<Payment> payments;
        if (userId != null && status != null) {
            payments = paymentService.getPaymentsByUserAndStatus(userId, status);
        } else if (userId != null) {
            payments = paymentService.getUserPayments(userId);
        } else if (status != null) {
            payments = paymentService.getPaymentsByStatus(status);
        } else {
            payments = paymentService.getAllPayments();
        }
        
        return ResponseEntity.ok(payments);
    }

    @PostMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Payment> createPayment(@Valid @RequestBody CreatePaymentDto paymentDto) {
        User user = currentUser.require();
        Payment payment = paymentService.createPayment(user, paymentDto.fineId(), paymentDto.amount(), paymentDto.method());
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> initiatePayment(@Valid @RequestBody InitiatePaymentDto paymentDto) {
        User user = currentUser.require();
        Fine fine = fineService.getFineById(paymentDto.fineId());
        
        if (!fine.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only pay your own fines");
        }
        
        Payment payment = paymentService.initiatePayment(user, fine, paymentDto.method());
        Map<String, Object> payHereData = paymentService.generatePayHereData(payment);
        
        return ResponseEntity.ok(Map.of(
            "payment", payment,
            "payHereData", payHereData
        ));
    }

    @PostMapping("/direct")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Payment> processDirectPayment(@Valid @RequestBody DirectPaymentDto paymentDto) {
        Fine fine = fineService.getFineById(paymentDto.fineId());
        Payment payment = paymentService.processDirectPayment(fine.getUser(), fine, paymentDto.method(), paymentDto.reference());
        return ResponseEntity.ok(payment);
    }

    @PostMapping("/notify")
    public ResponseEntity<String> handlePayHereNotification(@RequestParam Map<String, String> params) {
        paymentService.handlePayHereNotification(params);
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/return")
    public ResponseEntity<String> handlePaymentReturn(@RequestParam Map<String, String> params) {
        // Handle successful payment return from PayHere
        String orderID = params.get("order_id");
        Payment payment = paymentService.getPaymentByOrderId(orderID);
        
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            return ResponseEntity.ok("Payment completed successfully!");
        } else {
            return ResponseEntity.ok("Payment is being processed. You will be notified once completed.");
        }
    }

    @GetMapping("/cancel")
    public ResponseEntity<String> handlePaymentCancel(@RequestParam Map<String, String> params) {
        // Handle payment cancellation
        return ResponseEntity.ok("Payment was cancelled.");
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<Payment>> getMyPayments() {
        User user = currentUser.require();
        return ResponseEntity.ok(paymentService.getUserPayments(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> refundPayment(@PathVariable Long id, @RequestBody Map<String, String> refundData) {
        User user = currentUser.require();
        String reason = refundData.get("reason");
        paymentService.refundPayment(id, user, reason);
        return ResponseEntity.ok("Payment refunded successfully");
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> cancelPayment(@PathVariable Long id) {
        User user = currentUser.require();
        paymentService.cancelPayment(id, user);
        return ResponseEntity.ok("Payment cancelled successfully");
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getPaymentStats() {
        Map<String, Object> stats = paymentService.getPaymentStatistics();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/verify/{orderId}")
    public ResponseEntity<String> verifyPayment(@PathVariable String orderId) {
        paymentService.verifyAndCompletePayment(orderId);
        return ResponseEntity.ok("Payment verified and completed");
    }

    // DTOs
    public record InitiatePaymentDto(Long fineId, PaymentMethod method) {}
    public record DirectPaymentDto(Long fineId, PaymentMethod method, String reference) {}
    public record CreatePaymentDto(Long fineId, Double amount, PaymentMethod method) {}
}
