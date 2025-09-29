package com.sliit.library.service;

import com.sliit.library.model.*;
import com.sliit.library.repository.ActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sliit.library.dto.ActivityDto.*;

@Service
public class ActivityService {

  private final ActivityRepository repo;
  private final ObjectMapper objectMapper;

  public ActivityService(ActivityRepository repo, ObjectMapper objectMapper) {
    this.repo = repo;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void log(User user, ActivityType type, String message) {
    logActivity(user, type, message, null, null, null, null);
  }

  @Transactional
  public void logActivity(User user, ActivityType type, String message, String metadata, 
                         Long relatedBookId, Long relatedTransactionId, Long relatedFineId) {
    Activity activity = new Activity();
    activity.setUser(user);
    activity.setType(type);
    activity.setMessage(message);
    activity.setMetadata(metadata);
    activity.setRelatedBookId(relatedBookId);
    activity.setRelatedTransactionId(relatedTransactionId);
    activity.setRelatedFineId(relatedFineId);
    activity.setSeverity(getDefaultSeverity(type));

    // Try to get request context for IP and User Agent
    try {
      ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
      if (attributes != null) {
        HttpServletRequest request = attributes.getRequest();
        activity.setIpAddress(getClientIpAddress(request));
        activity.setUserAgent(request.getHeader("User-Agent"));
      }
    } catch (Exception e) {
      // Ignore if request context is not available
    }

    repo.save(activity);
  }

  @Transactional
  public void logWithMetadata(User user, ActivityType type, String message, Object metadataObject) {
    try {
      String metadata = objectMapper.writeValueAsString(metadataObject);
      logActivity(user, type, message, metadata, null, null, null);
    } catch (Exception e) {
      // Fall back to logging without metadata
      log(user, type, message);
    }
  }

  private ActivitySeverity getDefaultSeverity(ActivityType type) {
    return switch (type) {
      case BOOK_OVERDUE, BOOK_LOST, BOOK_DAMAGED, FINE_CREATED, PAYMENT_FAILED -> ActivitySeverity.WARNING;
      case USER_DELETED, BOOK_DELETED, POLICY_UPDATED -> ActivitySeverity.ERROR;
      default -> ActivitySeverity.INFO;
    };
  }

  private String getClientIpAddress(HttpServletRequest request) {
    String xForwardedFor = request.getHeader("X-Forwarded-For");
    if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
      return xForwardedFor.split(",")[0].trim();
    }
    
    String xRealIp = request.getHeader("X-Real-IP");
    if (xRealIp != null && !xRealIp.isEmpty()) {
      return xRealIp;
    }
    
    return request.getRemoteAddr();
  }

  public List<ActivityResponse> getByUserId(Long userId, int limit) {
    return repo.findByUserIdOrderByTimestampDesc(userId)
               .stream()
               .map(this::toResponse)
               .limit(limit)
               .toList();
  }

  public List<ActivityResponse> getAllActivities(Long userId, int page, int size) {
    if (userId != null) {
      return repo.findByUserIdOrderByTimestampDesc(userId)
                 .stream()
                 .skip((long) page * size)
                 .limit(size)
                 .map(this::toResponse)
                 .toList();
    } else {
      return repo.findAllByOrderByTimestampDesc()
                 .stream()
                 .skip((long) page * size)
                 .limit(size)
                 .map(this::toResponse)
                 .toList();
    }
  }

  public List<ActivityResponse> getSystemActivities(int limit) {
    return repo.findAllByOrderByTimestampDesc()
               .stream()
               .map(this::toResponse)
               .limit(limit)
               .toList();
  }

  public List<ActivityResponse> getActivitiesByType(ActivityType type, int limit) {
    return repo.findByTypeOrderByTimestampDesc(type)
               .stream()
               .map(this::toResponse)
               .limit(limit)
               .toList();
  }

  public List<ActivityResponse> getActivitiesBySeverity(ActivitySeverity severity, int limit) {
    return repo.findBySeverityOrderByTimestampDesc(severity)
               .stream()
               .map(this::toResponse)
               .limit(limit)
               .toList();
  }

  private ActivityResponse toResponse(Activity a) {
    return new ActivityResponse(a.getId(), a.getUser().getId(), a.getType(), a.getMessage(), a.getTimestamp());
  }
}
