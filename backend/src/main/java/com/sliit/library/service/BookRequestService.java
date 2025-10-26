package com.sliit.library.service;
 
import com.sliit.library.dto.BookRequestDto;
import com.sliit.library.exception.BusinessException;
import com.sliit.library.exception.ConflictException;
import com.sliit.library.exception.ForbiddenException;
import com.sliit.library.exception.ResourceNotFoundException;
import com.sliit.library.model.*;
import com.sliit.library.repository.BookRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BookRequestService {

    private final BookRequestRepository requestRepository;
    private final LibraryPolicyService policyService;
    private final BookCopyService bookCopyService;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    @Transactional
    public BookRequest requestBook(User user, Book book, String notes) {
        LibraryPolicy policy = policyService.getActivePolicy();

        // Check if user has reached maximum requests
        long currentRequests = requestRepository.countByUserAndStatus(user, RequestStatus.PENDING);
        if (currentRequests >= policy.getMaxRequestsPerUser()) {
            throw new BusinessException("Maximum number of requests reached (" + policy.getMaxRequestsPerUser() + ")");
        }

        // Check if user already has a pending request for this book
        Optional<BookRequest> existingRequest = requestRepository.findByUserAndBookAndStatus(
            user, book, RequestStatus.PENDING);
        if (existingRequest.isPresent()) {
            throw new ConflictException("You already have a pending request for this book");
        }

        // Allow requests for both available and unavailable books
        // Users can reserve books even if they're currently available

        BookRequest request = new BookRequest();
        request.setUser(user);
        request.setBook(book);
        request.setNotes(notes);
        request.setStatus(RequestStatus.PENDING);
        request.setRequestedAt(LocalDateTime.now());
        request.setExpiresAt(LocalDateTime.now().plusDays(policy.getRequestExpiryDays()));

        // Set queue position
        List<BookRequest> queue = requestRepository.findQueueForBook(book);
        request.setQueuePosition(queue.size() + 1);

        BookRequest savedRequest = requestRepository.save(request);

        // Log activity
        activityService.logActivity(user, ActivityType.BOOK_REQUESTED, 
            "Requested book: " + book.getTitle(), 
            null, book.getId(), null, null);

        // Send notification
        notificationService.sendBookRequestConfirmation(savedRequest);

        return savedRequest;
    }

    @Transactional
    public void cancelRequest(Long requestId, User user) {
        BookRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Book request not found"));

        if (!request.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only cancel your own requests");
        }

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be cancelled");
        }

        request.setStatus(RequestStatus.CANCELLED);
        request.setCancelledAt(LocalDateTime.now());
        requestRepository.save(request);

        // Update queue positions for other requests
        updateQueuePositions(request.getBook());

        // Log activity
        activityService.logActivity(user, ActivityType.BOOK_REQUEST_CANCELLED, 
            "Cancelled book request: " + request.getBook().getTitle(), 
            null, request.getBook().getId(), null, null);

        // Send notification
        notificationService.sendBookRequestCancellation(request);
    }

    @Transactional
    public void fulfillRequest(Long requestId, User librarian) {
        BookRequest request = requestRepository.findById(requestId)
            .orElseThrow(() -> new ResourceNotFoundException("Book request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BusinessException("Only pending requests can be fulfilled");
        }

        request.setStatus(RequestStatus.FULFILLED);
        request.setFulfilledAt(LocalDateTime.now());
        request.setFulfilledBy(librarian);
        requestRepository.save(request);

        // Update queue positions for other requests
        updateQueuePositions(request.getBook());

        // Log activity
        activityService.logActivity(request.getUser(), ActivityType.BOOK_REQUEST_FULFILLED, 
            "Book request fulfilled: " + request.getBook().getTitle(), 
            null, request.getBook().getId(), null, null);

        // Send notification
        notificationService.sendBookRequestFulfillment(request);
    }

    @Transactional
    public void expireOldRequests() {
        List<BookRequest> expiredRequests = requestRepository.findExpiredRequests(LocalDateTime.now());
        
        for (BookRequest request : expiredRequests) {
            request.setStatus(RequestStatus.EXPIRED);
            requestRepository.save(request);

            // Update queue positions
            updateQueuePositions(request.getBook());

            // Log activity
            activityService.logActivity(request.getUser(), ActivityType.BOOK_REQUEST_EXPIRED, 
                "Book request expired: " + request.getBook().getTitle(), 
                null, request.getBook().getId(), null, null);
        }
    }

    private void updateQueuePositions(Book book) {
        List<BookRequest> queue = requestRepository.findQueueForBook(book);
        for (int i = 0; i < queue.size(); i++) {
            BookRequest request = queue.get(i);
            request.setQueuePosition(i + 1);
            requestRepository.save(request);
        }
    }

    public List<BookRequest> getUserRequests(User user) {
        return requestRepository.findByUserAndStatus(user, RequestStatus.PENDING);
    }

    public List<BookRequest> getBookQueue(Book book) {
        return requestRepository.findQueueForBook(book);
    }

    public List<BookRequest> getAllPendingRequests() {
        return requestRepository.findAllPendingRequests();
    }

    public List<BookRequest> getAllRequests(int page, int pageSize) {
        // For admin/librarian to see all requests with pagination
        // Using simple pagination with subList for now
        List<BookRequest> allRequests = requestRepository.findAll();
        int startIndex = page * pageSize;
        int endIndex = Math.min(startIndex + pageSize, allRequests.size());
        if (startIndex >= allRequests.size()) {
            return List.of();
        }
        return allRequests.subList(startIndex, endIndex);
    }

    public BookRequest getRequestById(Long id) {
        return requestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Book request not found"));
    }

    public long getPendingRequestCount(User user) {
        return requestRepository.countByUserAndStatus(user, RequestStatus.PENDING);
    }

    // DTO methods for API responses
    public BookRequestDto.BookRequestResponse toDto(BookRequest request) {
        return new BookRequestDto.BookRequestResponse(
            request.getId(),
            request.getUser().getId(),
            request.getBook().getId(),
            request.getStatus(),
            request.getRequestedAt(),
            request.getExpiresAt(),
            request.getQueuePosition()
        );
    }

    public List<BookRequestDto.BookRequestResponse> getUserRequestDtos(User user) {
        return getUserRequests(user).stream()
            .map(this::toDto)
            .toList();
    }

    public List<BookRequestDto.BookRequestResponse> getBookQueueDtos(Book book) {
        return getBookQueue(book).stream()
            .map(this::toDto)
            .toList();
    }

    public List<BookRequestDto.BookRequestResponse> getAllPendingRequestDtos() {
        return getAllPendingRequests().stream()
            .map(this::toDto)
            .toList();
    }

    public List<BookRequestDto.BookRequestResponse> getAllRequestDtos(int page, int pageSize) {
        return getAllRequests(page, pageSize).stream()
            .map(this::toDto)
            .toList();
    }

    public BookRequestDto.BookRequestResponse getRequestDtoById(Long id) {
        return toDto(getRequestById(id));
    }
}
