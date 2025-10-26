package com.sliit.library.controller;

import java.util.List;
import java.util.Map;
import java.util.Arrays; 
import java.util.UUID;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import com.sliit.library.service.BookService;
import com.sliit.library.service.BookReviewService;
import com.sliit.library.dto.BookReviewDto.BookReviewResponse;
import com.sliit.library.dto.BookReviewDto.BookReviewSummary;

import lombok.RequiredArgsConstructor;

import com.sliit.library.dto.BookDto.*;
import net.coobird.thumbnailator.Thumbnails;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService service;
    private final BookReviewService reviewService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:5242880}")
    private long maxFileSize;

    @Value("${app.upload.allowed-types:jpg,jpeg,png,gif,webp}")
    private String allowedTypes;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse create(
        @RequestParam("title") String title,
        @RequestParam("authorId") Long authorId,
        @RequestParam("publisherId") Long publisherId,
        @RequestParam("isbn") String isbn,
        @RequestParam("year") Integer year,
        @RequestParam("languageId") Long languageId,
        @RequestParam("categoryId") Long categoryId,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "coverImage", required = false) MultipartFile coverImage) throws IOException {

        String coverImageUrl = null;
        if (coverImage != null && !coverImage.isEmpty()) {
            coverImageUrl = uploadBookCover(coverImage);
        }

        BookCreateRequest req = new BookCreateRequest(
            title, authorId, publisherId, isbn, year,
            languageId,
            categoryId, description, coverImageUrl
        );

        return service.create(req);
    }

    @GetMapping("/{id}")
    public BookResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<BookSummaryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.get(page, pageSize);
    }

    @PatchMapping("/{id}")
    public BookResponse update(
        @PathVariable Long id,
        @RequestParam(value = "title", required = false) String title,
        @RequestParam(value = "authorId", required = false) Long authorId,
        @RequestParam(value = "publisherId", required = false) Long publisherId,
        @RequestParam(value = "isbn", required = false) String isbn,
        @RequestParam(value = "year", required = false) Integer year,
        @RequestParam(value = "languageId", required = false) Long languageId,
        @RequestParam(value = "categoryId", required = false) Long categoryId,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "coverImage", required = false) MultipartFile coverImage) throws IOException {

        String coverImageUrl = null;
        if (coverImage != null && !coverImage.isEmpty()) {
            coverImageUrl = uploadBookCover(coverImage);
        }

        BookUpdateRequest req = new BookUpdateRequest(
            title, authorId, publisherId, isbn, year,
            languageId,
            categoryId, description, coverImageUrl
        );

        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Cannot delete book", "message", "This book cannot be deleted because it has associated book copies. Please remove all book copies first."));
        }
    }

    @GetMapping("/search")
    public List<BookSummaryResponse> search(@RequestParam String query,
                                     @RequestParam(required = false) Long category,
                                     @RequestParam(required = false) Long author,
                                     @RequestParam(required = false) Long publisher,
                                     @RequestParam(required = false) Long language,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int pageSize) {
        return service.search(query, category, author, publisher, language, page, pageSize);
    }

    @GetMapping("/{id}/reviews")
    public List<BookReviewResponse> getBookReviews(@PathVariable Long id,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int pageSize) {
        return reviewService.getReviewsByBook(id, page, pageSize);
    }

    @GetMapping("/{id}/reviews/summary")
    public BookReviewSummary getBookReviewSummary(@PathVariable Long id) {
        return reviewService.getBookReviewSummary(id);
    }

    // Image upload methods
    private String uploadBookCover(MultipartFile file) throws IOException {
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
