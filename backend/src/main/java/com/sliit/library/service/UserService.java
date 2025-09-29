package com.sliit.library.service;

import com.sliit.library.dto.UserDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.*;
import com.sliit.library.repository.UserRepository;
import com.sliit.library.repository.BookTransactionRepository;
import com.sliit.library.repository.BookReviewRepository;
import com.sliit.library.service.ImageUploadService;
import com.sliit.library.util.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class UserService {

  private final UserRepository repo;
  private final PasswordEncoder encoder;
  private final ActivityService activityService;
  private final CurrentUser currentUser;
  private final ImageUploadService imageUploadService;
  private final BookTransactionRepository bookTransactionRepo;
  private final BookReviewRepository bookReviewRepo;

  public UserService(UserRepository repo, PasswordEncoder encoder, ActivityService activityService, CurrentUser currentUser, ImageUploadService imageUploadService,
                     BookTransactionRepository bookTransactionRepo, BookReviewRepository bookReviewRepo) {
    this.repo = repo;
    this.encoder = encoder;
    this.activityService = activityService;
    this.currentUser = currentUser;
    this.imageUploadService = imageUploadService;
    this.bookTransactionRepo = bookTransactionRepo;
    this.bookReviewRepo = bookReviewRepo;
  }

  @Transactional
  public UserResponse create(UserCreateRequest req) {
    if (repo.existsByEmail(req.email()))
      throw new ApiException("Email already registered");
    if (repo.existsByUsername(req.username()))
      throw new ApiException("Username already taken");

    var user = new User();
    user.setName(req.name());
    user.setUsername(req.username());
    user.setEmail(req.email());
    user.setPasswordHash(encoder.encode(req.password()));
    user.setRole(req.role() != null ? req.role() : UserRole.MEMBER);
    user.setStatus(UserStatus.ACTIVE);
    user.setPicture(req.picture());

    var saved = repo.save(user);
    activityService.log(currentUser.require(), ActivityType.USER_CREATED, "User " + user.getName() + " created!");
    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public UserResponse getById(Long id) {
    var user = repo.findById(id).orElseThrow(() -> new ApiException("User not found"));
    return toResponse(user);
  }

  @Transactional(readOnly = true)
  public User findByIdEntity(Long id) {
    return repo.findById(id).orElseThrow(() -> new ApiException("User not found"));
  }

  @Transactional(readOnly = true)
  public UserPageResponse get(int page, int pageSize, String search, String role, String status) {
    UserRole userRole = null;
    if (role != null && !role.isEmpty()) {
      try {
        userRole = UserRole.valueOf(role.toUpperCase());
      } catch (IllegalArgumentException e) {
        // Invalid role, ignore filter
      }
    }

    UserStatus userStatus = null;
    if (status != null && !status.isEmpty()) {
      try {
        userStatus = UserStatus.valueOf(status.toUpperCase());
      } catch (IllegalArgumentException e) {
        // Invalid status, ignore filter
      }
    }

    List<User> allFiltered = repo.findWithFilters(search, userRole, userStatus);

    List<User> users;
    int totalPages;
    long totalElements = allFiltered.size();

    if (page == 0) {
      // Return all filtered results without pagination
      users = allFiltered;
      totalPages = 1;
    } else {
      // For paginated requests, manually paginate the filtered results
      int startIndex = (page - 1) * pageSize;
      int endIndex = Math.min(startIndex + pageSize, allFiltered.size());
      if (startIndex >= allFiltered.size()) {
        users = new ArrayList<>();
      } else {
        users = allFiltered.subList(startIndex, endIndex);
      }
      totalPages = (int) Math.ceil((double) totalElements / pageSize);
    }

    List<UserResponse> content = users.stream().map(this::toResponse).toList();

    return new UserPageResponse(content, totalPages, totalElements, page, pageSize);
  }

  public List<UserResponse> search(String query, int size) {
    if (query == null || query.trim().isEmpty()) {
      return repo.findAll().stream()
          .limit(size)
          .map(this::toResponse)
          .toList();
    }

    List<User> users = repo.findAll().stream()
        .filter(user ->
            (user.getName() != null && user.getName().toLowerCase().contains(query.toLowerCase())) ||
            (user.getEmail() != null && user.getEmail().toLowerCase().contains(query.toLowerCase())) ||
            (user.getUsername() != null && user.getUsername().toLowerCase().contains(query.toLowerCase()))
        )
        .limit(size)
        .toList();

    return users.stream().map(this::toResponse).toList();
  }

  public UserResponse update(Long id, UserUpdateRequest req) {
    var user = repo.findById(id).orElseThrow(() -> new ApiException("User not found"));

    if (req.email() != null && !req.email().equals(user.getEmail())) {
      if (repo.existsByEmail(req.email()))
        throw new ApiException("Email already registered");
      user.setEmail(req.email());
    }
    if (req.username() != null && !req.username().equals(user.getUsername())) {
      if (repo.existsByUsername(req.username()))
        throw new ApiException("Username already taken");
      user.setUsername(req.username());
    }
    if (req.newPassword() != null) {
      user.setPasswordHash(encoder.encode(req.newPassword()));
    }
    if (req.role() != null)
      user.setRole(req.role());
    if (req.status() != null)
      user.setStatus(req.status());
    if (req.name() != null)
      user.setName(req.name());
    if (req.picture() != null)
      user.setPicture(req.picture());

    activityService.log(currentUser.require(), ActivityType.USER_UPDATED, "User " + user.getName() + " updated!");

    return toResponse(user);
  }

  public void delete(Long id) {
    var user = repo.findById(id).orElseThrow(() -> new ApiException("User not found"));

    // Check for related records that would prevent deletion
    if (hasRelatedRecords(user)) {
      throw new ApiException("Cannot delete user with existing transactions, reviews, or other related records. Consider deactivating the user instead.");
    }

    // Delete profile picture and thumbnail if they exist
    if (user.getPicture() != null && !user.getPicture().isEmpty()) {
      // Delete the profile picture (100x100)
      imageUploadService.deleteImage(user.getPicture());

      // Delete the thumbnail (150x150) by replacing "_profile." with "_thumb."
      String thumbnailUrl = user.getPicture().replace("_profile.", "_thumb.");
      imageUploadService.deleteImage(thumbnailUrl);
    }

    // Actually delete the user from database
    repo.delete(user);
    activityService.log(currentUser.require(), ActivityType.USER_DELETED, "User " + user.getName() + " permanently deleted!");
  }

  private boolean hasRelatedRecords(User user) {
    Long userId = user.getId();

    // Check for book transactions
    if (!bookTransactionRepo.findByUserOrderByIssuedAtDesc(user).isEmpty()) {
      return true;
    }
    // Check for book reviews
    if (!bookReviewRepo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 1)).isEmpty()) {
      return true;
    }

    // For other entities, we'll allow deletion for now since they might not have critical data
    // In a production system, you would want to check all related entities

    return false;
  }

  private UserResponse toResponse(User user) {
    return new UserResponse(user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getRole(), user.getStatus(),
        user.getPicture(), user.getCreatedAt(), user.getUpdatedAt());
  }

  // Additional methods for AuthController
  public User findByUsername(String username) {
    return repo.findByUsername(username).orElse(null);
  }

  public User findByEmail(String email) {
    return repo.findByEmail(email).orElse(null);
  }

  public User findById(Long id) {
    return repo.findById(id).orElse(null);
  }

  public User save(User user) {
    return repo.save(user);
  }
}
