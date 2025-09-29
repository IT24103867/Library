package com.sliit.library.service;

import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ImageUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:5242880}")
    private long maxFileSize;

    @Value("${app.upload.allowed-types:jpg,jpeg,png,gif,webp}")
    private String allowedTypes;

    public String uploadImage(MultipartFile file, String type) throws IOException {
        validateFile(file);
        
        String fileName = generateFileName(file.getOriginalFilename(), type);
        Path uploadPath = createUploadDirectory(type);
        Path filePath = uploadPath.resolve(fileName);
        
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return "/uploads/" + type + "/" + fileName;
    }

    public String uploadProfilePicture(MultipartFile file) throws IOException {
        validateFile(file);

        if (!isValidProfilePicture(file)) {
            throw new IllegalArgumentException("Invalid profile picture dimensions");
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

    public String uploadBookCover(MultipartFile file) throws IOException {
        validateFile(file);

        String baseFileName = generateFileName(file.getOriginalFilename(), "books");
        String fileNameWithoutExt = baseFileName.substring(0, baseFileName.lastIndexOf('.'));
        String fileExtension = getFileExtension(baseFileName);

        Path uploadPath = createUploadDirectory("books");

        // Create compressed thumbnail (200x300 for smaller file sizes, maintaining aspect ratio)
        String thumbnailFileName = fileNameWithoutExt + "_thumb." + fileExtension;
        Path thumbnailPath = uploadPath.resolve(thumbnailFileName);

        // Process and save compressed thumbnail with higher compression
        Thumbnails.of(file.getInputStream())
                .size(200, 300)
                .keepAspectRatio(true)
                .outputQuality(0.7f)  // Higher compression for smaller files
                .toFile(thumbnailPath.toFile());

        // Return the thumbnail URL
        return "/uploads/books/" + thumbnailFileName;
    }

    public String uploadAuthorPicture(MultipartFile file) throws IOException {
        validateFile(file);

        String baseFileName = generateFileName(file.getOriginalFilename(), "authors");
        String fileNameWithoutExt = baseFileName.substring(0, baseFileName.lastIndexOf('.'));
        String fileExtension = getFileExtension(baseFileName);

        Path uploadPath = createUploadDirectory("authors");

        // Create square profile picture (100x100)
        String profileFileName = fileNameWithoutExt + "_profile." + fileExtension;
        Path profilePath = uploadPath.resolve(profileFileName);

        // Create thumbnail (200x200 for viewing)
        String thumbnailFileName = fileNameWithoutExt + "_thumb." + fileExtension;
        Path thumbnailPath = uploadPath.resolve(thumbnailFileName);

        // Process and save profile picture (100x100, cropped to square)
        Thumbnails.of(file.getInputStream())
                .size(100, 100)
                .crop(Positions.CENTER)
                .outputQuality(0.85f)
                .toFile(profilePath.toFile());

        // Process and save thumbnail (200x200, maintaining aspect ratio)
        Thumbnails.of(file.getInputStream())
                .size(200, 200)
                .keepAspectRatio(true)
                .outputQuality(0.8f)
                .toFile(thumbnailPath.toFile());

        // Return the profile picture URL (100x100 version)
        return "/uploads/authors/" + profileFileName;
    }

    public String uploadPublisherPicture(MultipartFile file) throws IOException {
        validateFile(file);

        String baseFileName = generateFileName(file.getOriginalFilename(), "publishers");
        String fileNameWithoutExt = baseFileName.substring(0, baseFileName.lastIndexOf('.'));
        String fileExtension = getFileExtension(baseFileName);

        Path uploadPath = createUploadDirectory("publishers");

        // Create square logo (100x100)
        String logoFileName = fileNameWithoutExt + "_logo." + fileExtension;
        Path logoPath = uploadPath.resolve(logoFileName);

        // Create thumbnail (200x200 for viewing)
        String thumbnailFileName = fileNameWithoutExt + "_thumb." + fileExtension;
        Path thumbnailPath = uploadPath.resolve(thumbnailFileName);

        // Process and save logo (100x100, cropped to square)
        Thumbnails.of(file.getInputStream())
                .size(100, 100)
                .crop(Positions.CENTER)
                .outputQuality(0.85f)
                .toFile(logoPath.toFile());

        // Process and save thumbnail (200x200, maintaining aspect ratio)
        Thumbnails.of(file.getInputStream())
                .size(200, 200)
                .keepAspectRatio(true)
                .outputQuality(0.8f)
                .toFile(thumbnailPath.toFile());

        // Return the logo URL (100x100 version)
        return "/uploads/publishers/" + logoFileName;
    }

    public void deleteAuthorImages(String profileImageUrl) {
        if (profileImageUrl != null && profileImageUrl.contains("_profile.")) {
            // Delete profile image
            deleteImage(profileImageUrl);
            
            // Delete corresponding thumbnail
            String thumbnailUrl = profileImageUrl.replace("_profile.", "_thumb.");
            deleteImage(thumbnailUrl);
        }
    }

    public void deletePublisherImages(String logoImageUrl) {
        if (logoImageUrl != null && logoImageUrl.contains("_logo.")) {
            // Delete logo image
            deleteImage(logoImageUrl);
            
            // Delete corresponding thumbnail
            String thumbnailUrl = logoImageUrl.replace("_logo.", "_thumb.");
            deleteImage(thumbnailUrl);
        }
    }

    public boolean deleteImage(String imageUrl) {
        try {
            if (imageUrl == null || !imageUrl.startsWith("/uploads/")) {
                return false;
            }
            
            Path filePath = Paths.get(uploadDir, imageUrl.substring("/uploads/".length()));
            return Files.deleteIfExists(filePath);
            
        } catch (IOException e) {
            return false;
        }
    }

    public boolean isValidImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return false;
        }
        
        if (imageUrl.startsWith("/uploads/")) {
            Path filePath = Paths.get(uploadDir, imageUrl.substring("/uploads/".length()));
            return Files.exists(filePath);
        }
        
        // For external URLs, basic validation
        return imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
    }

    public boolean isValidProfilePicture(MultipartFile file) {
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

    public boolean isValidBookCover(MultipartFile file) {
        try {
            BufferedImage image = ImageIO.read(file.getInputStream());
            if (image == null) return false;
            
            int width = image.getWidth();
            int height = image.getHeight();
            
            // Book covers should be portrait (height > width)
            return height > width;
            
        } catch (IOException e) {
            return false;
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size");
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
        List<String> allowedExtensions = Arrays.asList(allowedTypes.split(","));
        
        if (!allowedExtensions.contains(fileExtension)) {
            throw new IllegalArgumentException("File type not allowed. Allowed types: " + allowedTypes);
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
