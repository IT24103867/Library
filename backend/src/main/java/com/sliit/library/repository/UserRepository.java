package com.sliit.library.repository;

import com.sliit.library.model.User;
import com.sliit.library.model.UserRole;
import com.sliit.library.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);
  Optional<User> findByUsername(String username);
  boolean existsByEmail(String email);
  boolean existsByUsername(String username);
  long countByRole(UserRole role);

  @Query("SELECT u FROM User u WHERE " +
         "(:search IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
         "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
         "(:role IS NULL OR u.role = :role) AND " +
         "(:status IS NULL OR u.status = :status)")
  List<User> findWithFilters(@Param("search") String search,
                           @Param("role") UserRole role,
                           @Param("status") UserStatus status);
}
