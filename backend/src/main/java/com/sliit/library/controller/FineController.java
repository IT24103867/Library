package com.sliit.library.controller;

import com.sliit.library.dto.FineDto;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.UserRepository;
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
@RequestMapping("/api/fines")
@RequiredArgsConstructor
public class FineController {

    private final FineService fineService;
    private final CurrentUser currentUser;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<FineDto.FineResponse>> getAllFines(@RequestParam(defaultValue = "0") int page,
                                                                 @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(fineService.getAllFineDtos(page, pageSize));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<FineDto.FineResponse> createFine(@Valid @RequestBody CreateFineDto createDto) {
        User user = userRepository.findById(createDto.userId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        User createdBy = currentUser.require();
        
        FineType fineType = FineType.valueOf(createDto.type().toUpperCase());
        Fine fine = fineService.createCustomFine(user, fineType, createDto.amount(), createDto.description(), createdBy);
        
        return ResponseEntity.ok(fineService.toDto(fine));
    }
    @GetMapping("/my-fines")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<FineDto.FineResponse>> getMyFines() {
        User user = currentUser.require();
        return ResponseEntity.ok(fineService.getUserFineDtos(user));
    }

    @GetMapping("/my-unpaid")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<FineDto.FineResponse>> getMyUnpaidFines() {
        User user = currentUser.require();
        return ResponseEntity.ok(fineService.getUnpaidFineDtos(user));
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<FineDto.FineResponse>> getOverdueFines() {
        return ResponseEntity.ok(fineService.getOverdueFineDtos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FineDto.FineResponse> getFineById(@PathVariable Long id) {
        return ResponseEntity.ok(fineService.getFineDtoById(id));
    }

    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> payFine(@PathVariable Long id, @Valid @RequestBody PayFineDto payDto) {
        User paidBy = currentUser.require();
        fineService.payFine(id, payDto.amount(), paidBy, payDto.paymentReference());
        return ResponseEntity.ok("Fine payment recorded successfully");
    }    @PostMapping("/{id}/waive")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> waiveFine(@PathVariable Long id, @Valid @RequestBody WaiveFineDto waiveDto) {
        User waivedBy = currentUser.require();
        fineService.waiveFine(id, waivedBy, waiveDto.reason());
        return ResponseEntity.ok("Fine waived successfully");
    }

    @GetMapping("/summary/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getUserFineSummary(@PathVariable Long userId) {
        // This would need UserService to get user by ID
        return ResponseEntity.ok(Map.of(
            "totalUnpaid", 0.0, // fineService.getTotalUnpaidAmount(user)
            "hasUnpaidFines", false, // fineService.hasUnpaidFines(user)
            "fineCount", 0
        ));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getFineStats() {
        return ResponseEntity.ok(Map.of(
            "totalOverdueFines", fineService.getOverdueFines().size(),
            "totalCollected", 0.0,
            "totalOutstanding", 0.0
        ));
    }

    // DTOs
    public record PayFineDto(Double amount, String paymentReference) {}
    public record WaiveFineDto(String reason) {}
    public record CreateFineDto(Long userId, String type, Double amount, String description) {}
}
