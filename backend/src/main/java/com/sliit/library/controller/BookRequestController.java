package com.sliit.library.controller;

import com.sliit.library.dto.BookRequestDto;
import com.sliit.library.model.Book;
import com.sliit.library.model.BookRequest;
import com.sliit.library.model.User;
import com.sliit.library.service.BookRequestService;
import com.sliit.library.service.BookService;
import com.sliit.library.util.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/book-requests")
@RequiredArgsConstructor
@Slf4j
public class BookRequestController {

    private final BookRequestService requestService;
    private final BookService bookService;
    private final CurrentUser currentUser;

    @PostMapping
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<BookRequestDto.BookRequestResponse> requestBook(@Valid @RequestBody RequestBookDto requestDto) {
        try {
            log.info("Processing book request for book ID: {}", requestDto.bookId());
            User user = currentUser.require();
            Book book = bookService.getBookEntityById(requestDto.bookId());
            BookRequest request = requestService.requestBook(user, book, requestDto.notes());
            log.info("Book request created successfully with ID: {}", request.getId());
            return ResponseEntity.ok(requestService.toDto(request));
        } catch (Exception e) {
            log.error("Error processing book request for book ID: {}", requestDto.bookId(), e);
            throw e;
        }
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<BookRequestDto.BookRequestResponse>> getMyRequests() {
        User user = currentUser.require();
        return ResponseEntity.ok(requestService.getUserRequestDtos(user));
    }

    @GetMapping("/queue/{bookId}")
    public ResponseEntity<List<BookRequestDto.BookRequestResponse>> getBookQueue(@PathVariable Long bookId) {
        Book book = bookService.getBookEntityById(bookId);
        return ResponseEntity.ok(requestService.getBookQueueDtos(book));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<BookRequestDto.BookRequestResponse>> getAllPendingRequests() {
        return ResponseEntity.ok(requestService.getAllPendingRequestDtos());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<List<BookRequestDto.BookRequestResponse>> getAllRequests(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "10") int pageSize) {
        return ResponseEntity.ok(requestService.getAllRequestDtos(page, pageSize));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('MEMBER') or hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> cancelRequest(@PathVariable Long id) {
        User user = currentUser.require();
        requestService.cancelRequest(id, user);
        return ResponseEntity.ok("Request cancelled successfully");
    }

    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<String> fulfillRequest(@PathVariable Long id) {
        User user = currentUser.require();
        requestService.fulfillRequest(id, user);
        return ResponseEntity.ok("Request fulfilled successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookRequestDto.BookRequestResponse> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getRequestDtoById(id));
    }

    @GetMapping("/stats/{userId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('LIBRARIAN')")
    public ResponseEntity<Map<String, Object>> getUserRequestStats(@PathVariable Long userId) {
        // This would need UserService to get user by ID
        // For now, return basic stats
        return ResponseEntity.ok(Map.of(
            "pendingRequests", 0, // requestService.getPendingRequestCount(user)
            "totalRequests", 0
        ));
    }

    // DTO for request body
    public record RequestBookDto(Long bookId, String notes) {}
}
