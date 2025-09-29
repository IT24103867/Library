package com.sliit.library.controller;

import com.sliit.library.dto.UserDto.*;
import com.sliit.library.service.UserService;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ResponseEntity<?> create(
      @RequestParam("name") String name,
      @RequestParam("username") String username,
      @RequestParam("email") String email,
      @RequestParam("password") String password,
      @RequestParam(value = "role", required = false) String role,
      @RequestParam(value = "file", required = false) MultipartFile file) {

    try {
      // Handle profile picture upload if provided
      String pictureUrl = null;
      if (file != null && !file.isEmpty()) {
        pictureUrl = uploadProfilePicture(file);
      }

      // Create user request
      UserCreateRequest req = new UserCreateRequest(name, username, email, password,
          role != null ? com.sliit.library.model.UserRole.valueOf(role.toUpperCase()) : null,
          pictureUrl);

      UserResponse response = service.create(req);

      Map<String, Object> result = new HashMap<>();
      result.put("success", true);
      result.put("message", "User created successfully");
      result.put("user", response);

      return ResponseEntity.status(HttpStatus.CREATED).body(result);

    } catch (Exception e) {
      Map<String, Object> error = new HashMap<>();
      error.put("success", false);
      error.put("error", e.getMessage());
      return ResponseEntity.badRequest().body(error);
    }
  }

  @GetMapping("/{id}")
  public UserResponse get(@PathVariable Long id) {
    return service.getById(id);
  }

  @GetMapping
  public UserPageResponse get(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int pageSize,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) String status) {
    return service.get(page, pageSize, search, role, status);
  }

  @GetMapping("/search")
  public List<UserResponse> search(
      @RequestParam(required = false) String query,
      @RequestParam(defaultValue = "3") int size) {
    return service.search(query, size);
  }

  @PatchMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable Long id,
      @RequestParam(value = "name", required = false) String name,
      @RequestParam(value = "username", required = false) String username,
      @RequestParam(value = "email", required = false) String email,
      @RequestParam(value = "newPassword", required = false) String newPassword,
      @RequestParam(value = "role", required = false) String role,
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "file", required = false) MultipartFile file) {

    try {
      // Handle profile picture upload if provided
      String pictureUrl = null;
      if (file != null && !file.isEmpty()) {
        pictureUrl = uploadProfilePicture(file);
      }

      // Create update request
      UserUpdateRequest req = new UserUpdateRequest(username, email, newPassword, name,
          role != null ? com.sliit.library.model.UserRole.valueOf(role.toUpperCase()) : null,
          status != null ? com.sliit.library.model.UserStatus.valueOf(status.toUpperCase()) : null,
          pictureUrl);

      UserResponse response = service.update(id, req);

      Map<String, Object> result = new HashMap<>();
      result.put("success", true);
      result.put("message", "User updated successfully");
      result.put("user", response);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      Map<String, Object> error = new HashMap<>();
      error.put("success", false);
      error.put("error", e.getMessage());
      return ResponseEntity.badRequest().body(error);
    }
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable Long id) {
    service.delete(id);
  }

  @GetMapping("/image/{fileName}")
  public ResponseEntity<Resource> getProfileImage(@PathVariable String fileName) {
    try {
      Path filePath = Paths.get(uploadDir, "profiles", fileName).toAbsolutePath();
      Resource resource = new UrlResource(filePath.toUri());

      if (resource.exists() && resource.isReadable()) {
        // Determine content type
        String contentType = determineContentType(fileName);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(contentType))
            .body(resource);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }

  private String determineContentType(String fileName) {
    String extension = getFileExtension(fileName).toLowerCase();
    return switch (extension) {
      case "jpg", "jpeg" -> "image/jpeg";
      case "png" -> "image/png";
      case "gif" -> "image/gif";
      case "webp" -> "image/webp";
      default -> "application/octet-stream";
    };
  }

  private String uploadProfilePicture(MultipartFile file) throws IOException {
    validateProfilePictureFile(file);

    if (!isValidProfilePicture(file)) {
      throw new IllegalArgumentException("Profile picture must be a square image (1:1 aspect ratio)");
    }

    String baseFileName = generateFileName(file.getOriginalFilename(), "profiles");
    String fileNameWithoutExt = baseFileName.substring(0, baseFileName.lastIndexOf('.'));
    String fileExtension = getFileExtension(baseFileName);

    Path uploadPath = createUploadDirectory("profiles");

    // Create profile picture (100x100)
    String profileFileName = fileNameWithoutExt + "_profile." + fileExtension;
    Path profilePath = uploadPath.resolve(profileFileName);

    // Create thumbnail (150x150 for viewing)
    String thumbnailFileName = fileNameWithoutExt + "_thumb." + fileExtension;
    Path thumbnailPath = uploadPath.resolve(thumbnailFileName);

    // Process and save profile picture (100x100)
    Thumbnails.of(file.getInputStream())
        .size(100, 100)
        .crop(Positions.CENTER)
        .outputQuality(0.85f)
        .toFile(profilePath.toFile());

    // Process and save thumbnail (150x150)
    Thumbnails.of(file.getInputStream())
        .size(150, 150)
        .crop(Positions.CENTER)
        .outputQuality(0.9f)
        .toFile(thumbnailPath.toFile());

    // Return the profile picture URL (100x100 version)
    return "/uploads/profiles/" + profileFileName;
  }

  private void validateProfilePictureFile(MultipartFile file) {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("File is empty");
    }

    if (file.getSize() > 5 * 1024 * 1024) { // 5MB max
      throw new IllegalArgumentException("File size must be less than 5MB");
    }

    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new IllegalArgumentException("Only image files are allowed");
    }

    String fileName = file.getOriginalFilename();
    if (fileName == null) {
      throw new IllegalArgumentException("Invalid file name");
    }

    String fileExtension = getFileExtension(fileName).toLowerCase();
    List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "gif", "webp");

    if (!allowedExtensions.contains(fileExtension)) {
      throw new IllegalArgumentException("File type not allowed. Allowed types: jpg, jpeg, png, gif, webp");
    }
  }

  private boolean isValidProfilePicture(MultipartFile file) {
    try {
      BufferedImage image = ImageIO.read(file.getInputStream());
      if (image == null) return false;

      int width = image.getWidth();
      int height = image.getHeight();

      // Allow some tolerance for square images (within 10% difference)
      double ratio = (double) width / height;
      return ratio >= 0.9 && ratio <= 1.1;

    } catch (IOException e) {
      return false;
    }
  }

  private String generateFileName(String originalFileName, String type) {
    String fileExtension = getFileExtension(originalFileName);
    String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    String uuid = UUID.randomUUID().toString().substring(0, 8);

    return type + "_" + timestamp + "_" + uuid + "." + fileExtension;
  }

  private String getFileExtension(String fileName) {
    if (fileName == null || fileName.lastIndexOf('.') == -1) {
      return "";
    }
    return fileName.substring(fileName.lastIndexOf('.') + 1);
  }

  private Path createUploadDirectory(String type) throws IOException {
    Path uploadPath = Paths.get(uploadDir, type).toAbsolutePath();
    if (!Files.exists(uploadPath)) {
      Files.createDirectories(uploadPath);
    }
    return uploadPath;
  }
}
