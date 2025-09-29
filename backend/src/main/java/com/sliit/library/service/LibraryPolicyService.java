package com.sliit.library.service;

import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.LibraryPolicy;
import com.sliit.library.model.PolicyStatus;
import com.sliit.library.model.User;
import com.sliit.library.repository.LibraryPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LibraryPolicyService {

    private final LibraryPolicyRepository policyRepository;

    @Value("${library.default.borrowing.period.days:14}")
    private int defaultBorrowingPeriodDays;

    @Value("${library.default.renewal.limit:2}")
    private int defaultRenewalLimit;

    @Value("${library.default.max.books.per.user:5}")
    private int defaultMaxBooksPerUser;

    @Value("${library.default.fine.per.day:1.0}")
    private double defaultFinePerDay;

    @Value("${library.default.max.fine.amount:50.0}")
    private double defaultMaxFineAmount;

    public LibraryPolicy getActivePolicy() {
        return policyRepository.findActivePolicy()
                .orElseGet(this::createDefaultPolicy);
    }

    public Optional<LibraryPolicy> findActivePolicy() {
        return policyRepository.findActivePolicy();
    }

    @Transactional
    public LibraryPolicy createDefaultPolicy() {
        // Check if a default policy already exists
        Optional<LibraryPolicy> existing = policyRepository.findByPolicyName("Default Library Policy");
        if (existing.isPresent()) {
            return existing.get();
        }

        LibraryPolicy defaultPolicy = new LibraryPolicy();
        defaultPolicy.setPolicyName("Default Library Policy");
        defaultPolicy.setDescription("Default system library policy with standard borrowing rules");
        defaultPolicy.setMaxBooksPerUser(defaultMaxBooksPerUser);
        defaultPolicy.setBorrowingPeriodDays(defaultBorrowingPeriodDays);
        defaultPolicy.setRenewalLimit(defaultRenewalLimit);
        defaultPolicy.setGracePeriodDays(3);
        defaultPolicy.setFinePerDayOverdue(defaultFinePerDay);
        defaultPolicy.setMaxFineAmount(defaultMaxFineAmount);
        defaultPolicy.setDamagedBookFinePercentage(50.0);
        defaultPolicy.setLostBookFinePercentage(100.0);
        defaultPolicy.setMaxRequestsPerUser(3);
        defaultPolicy.setRequestExpiryDays(7);
        defaultPolicy.setAllowRenewal(true);
        defaultPolicy.setAllowRequests(true);
        defaultPolicy.setEmailNotifications(true);
        defaultPolicy.setSmsNotifications(false);
        defaultPolicy.setStatus(PolicyStatus.ACTIVE);
        
        // createdBy can be null for system-generated policies

        return policyRepository.save(defaultPolicy);
    }

    @Transactional
    public LibraryPolicy createPolicy(LibraryPolicy policy, User createdBy) {
        policy.setCreatedBy(createdBy);
        policy.setStatus(PolicyStatus.DRAFT);
        return policyRepository.save(policy);
    }

    @Transactional
    public LibraryPolicy updatePolicy(Long policyId, LibraryPolicy updatedPolicy) {
        LibraryPolicy existingPolicy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        existingPolicy.setPolicyName(updatedPolicy.getPolicyName());
        existingPolicy.setDescription(updatedPolicy.getDescription());
        existingPolicy.setMaxBooksPerUser(updatedPolicy.getMaxBooksPerUser());
        existingPolicy.setBorrowingPeriodDays(updatedPolicy.getBorrowingPeriodDays());
        existingPolicy.setRenewalLimit(updatedPolicy.getRenewalLimit());
        existingPolicy.setGracePeriodDays(updatedPolicy.getGracePeriodDays());
        existingPolicy.setFinePerDayOverdue(updatedPolicy.getFinePerDayOverdue());
        existingPolicy.setMaxFineAmount(updatedPolicy.getMaxFineAmount());
        existingPolicy.setDamagedBookFinePercentage(updatedPolicy.getDamagedBookFinePercentage());
        existingPolicy.setLostBookFinePercentage(updatedPolicy.getLostBookFinePercentage());
        existingPolicy.setMaxRequestsPerUser(updatedPolicy.getMaxRequestsPerUser());
        existingPolicy.setRequestExpiryDays(updatedPolicy.getRequestExpiryDays());
        existingPolicy.setAllowRenewal(updatedPolicy.getAllowRenewal());
        existingPolicy.setAllowRequests(updatedPolicy.getAllowRequests());
        existingPolicy.setEmailNotifications(updatedPolicy.getEmailNotifications());
        existingPolicy.setSmsNotifications(updatedPolicy.getSmsNotifications());

        return policyRepository.save(existingPolicy);
    }

    @Transactional
    public void activatePolicy(Long policyId) {
        // First deactivate all current active policies
        LibraryPolicy currentActive = policyRepository.findActivePolicy().orElse(null);
        if (currentActive != null) {
            currentActive.setStatus(PolicyStatus.INACTIVE);
            policyRepository.save(currentActive);
        }

        // Activate the new policy
        LibraryPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
        policy.setStatus(PolicyStatus.ACTIVE);
        policyRepository.save(policy);
    }

    public List<LibraryPolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    public LibraryPolicy getPolicyById(Long id) {
        return policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
    }

    @Transactional
    public void deletePolicy(Long policyId) {
        LibraryPolicy policy = getPolicyById(policyId);
        if (policy.getStatus() == PolicyStatus.ACTIVE) {
            throw new BusinessException("Cannot delete active policy");
        }
        policyRepository.delete(policy);
    }
}
