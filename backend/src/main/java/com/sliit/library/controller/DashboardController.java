package com.sliit.library.controller;

import com.sliit.library.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // Admin Dashboard APIs
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminDashboardStats() {
        return ResponseEntity.ok(dashboardService.getAdminDashboardStats());
    }

    @GetMapping("/admin/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminOverview() {
        return ResponseEntity.ok(dashboardService.getAdminOverview());
    }

    @GetMapping("/admin/financial")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getFinancialStats() {
        return ResponseEntity.ok(dashboardService.getFinancialStats());
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserManagementStats() {
        return ResponseEntity.ok(dashboardService.getUserManagementStats());
    }

    // Librarian Dashboard APIs
    @GetMapping("/librarian/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getLibrarianDashboardStats() {
        return ResponseEntity.ok(dashboardService.getLibrarianDashboardStats());
    }

    @GetMapping("/librarian/circulation")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getCirculationStats() {
        return ResponseEntity.ok(dashboardService.getCirculationStats());
    }

    @GetMapping("/librarian/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getOverdueItems() {
        return ResponseEntity.ok(dashboardService.getOverdueItems());
    }

    @GetMapping("/librarian/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getPendingRequests() {
        return ResponseEntity.ok(dashboardService.getPendingRequests());
    }

    @GetMapping("/librarian/activity")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getRecentActivity(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dashboardService.getRecentActivity(limit));
    }
}