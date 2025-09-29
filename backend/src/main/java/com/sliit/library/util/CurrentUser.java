package com.sliit.library.util;

import com.sliit.library.exception.ApiException;
import com.sliit.library.model.User;
import com.sliit.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CurrentUser {

  private final UserRepository userRepository;
  private final SecurityContextHolderStrategy ctx =
      SecurityContextHolder.getContextHolderStrategy();

  /** Get the username of the authenticated principal (throws if not logged in). */
  public String requireUsername() {
    Authentication auth = ctx.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
      throw new ApiException("Not authenticated");
    }
    Object principal = auth.getPrincipal();
    if (principal instanceof UserDetails ud) return ud.getUsername();
    // JWT / custom principals typically make getName() return the subject/username
    return auth.getName();
  }

  /** Get the full User entity (throws if not logged in or user missing). */
  public User require() {
    String username = requireUsername();
    return userRepository.findByUsername(username)
        .orElseThrow(() -> new ApiException("User not found: " + username));
  }

  /** Optional variant: empty if not authenticated or not found. */
  public Optional<User> optional() {
    try {
      return Optional.of(require());
    } catch (ApiException e) {
      return Optional.empty();
    }
  }
}
