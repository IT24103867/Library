package com.sliit.library.repository;

import com.sliit.library.model.LibraryPolicy;
import com.sliit.library.model.PolicyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LibraryPolicyRepository extends JpaRepository<LibraryPolicy, Long> {
    
    Optional<LibraryPolicy> findByPolicyNameAndStatus(String policyName, PolicyStatus status);
    
    @Query("SELECT p FROM LibraryPolicy p WHERE p.status = 'ACTIVE' ORDER BY p.createdAt DESC")
    Optional<LibraryPolicy> findActivePolicy();
    
    Optional<LibraryPolicy> findByPolicyName(String policyName);
}
