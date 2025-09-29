package com.sliit.library.controller;

import com.sliit.library.model.LibraryPolicy;
import com.sliit.library.model.User;
import com.sliit.library.service.LibraryPolicyService;
import com.sliit.library.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
public class LibraryPolicyController {

    private final LibraryPolicyService policyService;
    private final CurrentUser currentUser;

    @GetMapping("/active")
    public ResponseEntity<LibraryPolicy> getActivePolicy() {
        return ResponseEntity.ok(policyService.getActivePolicy());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<LibraryPolicy>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<LibraryPolicy> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LibraryPolicy> createPolicy(@Valid @RequestBody LibraryPolicy policy) {
        User user = currentUser.require();
        LibraryPolicy savedPolicy = policyService.createPolicy(policy, user);
        return ResponseEntity.ok(savedPolicy);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LibraryPolicy> updatePolicy(@PathVariable Long id, 
                                                      @Valid @RequestBody LibraryPolicy policy) {
        LibraryPolicy updatedPolicy = policyService.updatePolicy(id, policy);
        return ResponseEntity.ok(updatedPolicy);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> activatePolicy(@PathVariable Long id) {
        policyService.activatePolicy(id);
        return ResponseEntity.ok("Policy activated successfully");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deletePolicy(@PathVariable Long id) {
        policyService.deletePolicy(id);
        return ResponseEntity.ok("Policy deleted successfully");
    }
}
