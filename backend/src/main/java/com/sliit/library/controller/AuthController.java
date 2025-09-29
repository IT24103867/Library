package com.sliit.library.controller;

import com.sliit.library.config.JwtTokenUtil;
import com.sliit.library.model.User;
import com.sliit.library.model.UserRole;
import com.sliit.library.model.UserStatus;
import com.sliit.library.service.JwtUserDetailsService;
import com.sliit.library.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final JwtUserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Find user by username
            User user = userService.findByUsername(loginRequest.getUsername());
            
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
            }

            // Check password
            if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPasswordHash())) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
            }

            // Generate JWT token
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
            String token = jwtTokenUtil.generateToken(userDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            // Create user response without password
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", user.getId());
            userResponse.put("username", user.getUsername());
            userResponse.put("email", user.getEmail());
            userResponse.put("name", user.getName());
            userResponse.put("profilePicture", user.getPicture());
            userResponse.put("role", user.getRole());
            
            response.put("user", userResponse);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Check if username already exists
            User existingUser = userService.findByUsername(registerRequest.getUsername());
            if (existingUser != null) {
                return ResponseEntity.status(400).body(Map.of("message", "Username already exists"));
            }

            // Check if email already exists
            existingUser = userService.findByEmail(registerRequest.getEmail());
            if (existingUser != null) {
                return ResponseEntity.status(400).body(Map.of("message", "Email already exists"));
            }

            // Create new user
            User newUser = new User();
            newUser.setUsername(registerRequest.getUsername());
            newUser.setEmail(registerRequest.getEmail());
            newUser.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            newUser.setName(registerRequest.getFirstName() + " " + registerRequest.getLastName());
            newUser.setRole(UserRole.MEMBER); // Default role
            newUser.setStatus(UserStatus.ACTIVE);

            User savedUser = userService.save(newUser);

            // Generate proper JWT token
            UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getUsername());
            String token = jwtTokenUtil.generateToken(userDetails);

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            // Create user response without password
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", savedUser.getId());
            userResponse.put("username", savedUser.getUsername());
            userResponse.put("email", savedUser.getEmail());
            userResponse.put("name", savedUser.getName());
            userResponse.put("role", savedUser.getRole());
            
            response.put("user", userResponse);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Registration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authorization) {
        try {
            // Extract username from JWT token
            if (!authorization.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid token format"));
            }

            String jwtToken = authorization.substring(7);
            String username = jwtTokenUtil.getUsernameFromToken(jwtToken);
            
            if (username == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Invalid token"));
            }

            User user = userService.findByUsername(username);

            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found"));
            }

            // Create user response without password
            Map<String, Object> userResponse = new HashMap<>();
            userResponse.put("id", user.getId());
            userResponse.put("username", user.getUsername());
            userResponse.put("email", user.getEmail());
            userResponse.put("name", user.getName());
            userResponse.put("role", user.getRole());

            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to get profile: " + e.getMessage()));
        }
    }

    // Inner classes for request DTOs
    @Getter
    @Setter
    public static class LoginRequest {
        @NotBlank(message = "Username is required")
        private String username;
        
        @NotBlank(message = "Password is required")
        private String password;
    }

    @Getter
    @Setter
    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        private String username;
        
        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;
        
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
        
        @NotBlank(message = "First name is required")
        private String firstName;
        
        @NotBlank(message = "Last name is required")
        private String lastName;
    }
}
