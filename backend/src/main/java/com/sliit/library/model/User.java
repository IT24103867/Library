package com.sliit.library.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users",
       uniqueConstraints = {
         @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
         @UniqueConstraint(name = "uk_users_username", columnNames = "username")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"passwordHash"}) // Exclude sensitive data
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @EqualsAndHashCode.Include
  private Long id;

  @NotBlank(message = "Username is required")
  @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
  @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers, and underscores")
  @Column(nullable = false, length = 50, unique = true)
  private String username;

  @NotBlank(message = "Email is required")
  @Email(message = "Invalid email format")
  @Size(max = 100, message = "Email must not exceed 100 characters")
  @Column(nullable = false, length = 100, unique = true)
  private String email;

  @Size(max = 100, message = "Name must not exceed 100 characters")
  @Column(length = 100)
  private String name;

  @NotBlank(message = "Password is required")
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @NotNull(message = "Role is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private UserRole role = UserRole.MEMBER;

  @NotNull(message = "Status is required")
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private UserStatus status = UserStatus.ACTIVE;
  
  @Size(max = 500, message = "Picture URL must not exceed 500 characters")
  @Column(length = 500)
  private String picture;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
  
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }
}
