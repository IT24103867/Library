package com.sliit.library.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.BookCopyDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Book;
import com.sliit.library.model.BookCondition;
import com.sliit.library.model.BookCopy;
import com.sliit.library.model.BookStatus;
import com.sliit.library.repository.BookCopyRepository;
import com.sliit.library.repository.BookRepository;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class BookCopyService {

    private final BookCopyRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;
    private final BookRepository bookRepository;

    public BookCopyService(BookCopyRepository repo, ActivityService activityService, CurrentUser currentUser, BookRepository bookRepository) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public BookCopyResponse create(BookCopyCreateRequest req) {
        if (repo.existsByBarcode(req.barcode())) {
            throw new ApiException("Barcode already exists");
        }

        var bookCopy = new BookCopy();
        bookCopy.setBarcode(req.barcode());
        bookCopy.setBook(bookRepository.findById(req.bookId())
            .orElseThrow(() -> new ApiException("Book not found")));
        bookCopy.setStatus(req.status());
        bookCopy.setReferenceOnly(req.isReferenceOnly());
        bookCopy.setCondition(req.condition());
        bookCopy.setLocation(req.location());
        bookCopy.setCreatedAt(LocalDateTime.now());
        bookCopy.setUpdatedAt(LocalDateTime.now());

        var saved = repo.save(bookCopy);
        activityService.log(currentUser.require(), ActivityType.BOOK_COPY_CREATED, "Book copy " + bookCopy.getId() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookCopyResponse getByBarcode(String barcode) {
        var bookCopy = repo.findByBarcode(barcode).orElseThrow(() -> new ApiException("Book copy not found with barcode: " + barcode));
        return toResponse(bookCopy);
    }

    @Transactional(readOnly = true)
    public List<BookCopyResponse> searchByBarcode(String barcode, BookStatus status) {
        List<BookCopy> bookCopies;
        if (status != null) {
            bookCopies = repo.findAll().stream()
                .filter(copy -> copy.getBarcode().toLowerCase().contains(barcode.toLowerCase()) && copy.getStatus() == status)
                .toList();
        } else {
            bookCopies = repo.findAll().stream()
                .filter(copy -> copy.getBarcode().toLowerCase().contains(barcode.toLowerCase()))
                .toList();
        }
        return bookCopies.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BookCopy findByIdEntity(Long id) {
        return repo.findById(id).orElseThrow(() -> new ApiException("Book copy not found"));
    }

    @Transactional(readOnly = true)
    public BookCopyResponse getById(Long id) {
        var bookCopy = repo.findById(id).orElseThrow(() -> new ApiException("Book copy not found"));
        return toResponse(bookCopy);
    }

    @Transactional(readOnly = true)
    public List<BookCopyResponse> get(int page, int pageSize) {
        if (page == 0) {
            var bookCopies = repo.findAll();
            return bookCopies.stream().map(this::toResponse).toList();
        }
        var bookCopies = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return bookCopies.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<BookCopyResponse> getByBookId(Long bookId) {
        var bookCopies = repo.findByBookId(bookId);
        return bookCopies.stream().map(this::toResponse).toList();
    }

    @Transactional
    public BookCopyResponse update(Long id, BookCopyUpdateRequest req) {
        var bookCopy = repo.findById(id).orElseThrow(() -> new ApiException("Book copy not found"));

        if (req.barcode() != null)
            bookCopy.setBarcode(req.barcode());
        if (req.bookId() != null)
            bookCopy.setBook(bookRepository.findById(req.bookId())
                    .orElseThrow(() -> new ApiException("Book not found")));
        if (req.status() != null)
            bookCopy.setStatus(req.status());
        if (req.isReferenceOnly() != null)
            bookCopy.setReferenceOnly(req.isReferenceOnly());
        if (req.condition() != null)
            bookCopy.setCondition(req.condition());
        if (req.location() != null)
            bookCopy.setLocation(req.location());

        bookCopy.setUpdatedAt(LocalDateTime.now());

        activityService.log(currentUser.require(), ActivityType.BOOK_COPY_UPDATED, "Book copy " + bookCopy.getId() + " updated!");

        return toResponse(bookCopy);
    }

    public void delete(Long id) {
        var bookCopy = repo.findById(id).orElseThrow(() -> new ApiException("Book copy not found"));
        repo.delete(bookCopy);
        activityService.log(currentUser.require(), ActivityType.BOOK_COPY_DELETED, "Book copy " + bookCopy.getId() + " deleted!");
    }

    private BookCopyResponse toResponse(BookCopy bookCopy) {
        try {
            Book book = bookCopy.getBook();
            String authorName = "Unknown Author";
            String bookTitle = "Unknown Title";
            String isbn = "N/A";
            Long bookId = -1L;

            if (book != null) {
                bookId = book.getId();
                bookTitle = book.getTitle() != null ? book.getTitle() : "Unknown Title";
                isbn = book.getIsbn() != null ? book.getIsbn() : "N/A";

                if (book.getAuthor() != null) {
                    authorName = book.getAuthor().getName() != null ? book.getAuthor().getName() : "Unknown Author";
                }
            }

            return new BookCopyResponse(
                bookCopy.getId(),
                bookId,
                bookTitle,
                authorName,
                isbn,
                bookCopy.getStatus(),
                bookCopy.getBarcode(),
                bookCopy.isReferenceOnly(),
                bookCopy.getCondition(),
                bookCopy.getLocation(),
                bookCopy.getCreatedAt(),
                bookCopy.getUpdatedAt()
            );
        } catch (Exception e) {
            // Return a safe response if anything goes wrong
            return new BookCopyResponse(
                bookCopy.getId(),
                -1L,
                "Unknown Title",
                "Unknown Author",
                "N/A",
                bookCopy.getStatus(),
                bookCopy.getBarcode() != null ? bookCopy.getBarcode() : "N/A",
                bookCopy.isReferenceOnly(),
                bookCopy.getCondition(),
                bookCopy.getLocation(),
                bookCopy.getCreatedAt(),
                bookCopy.getUpdatedAt()
            );
        }
    }

    public boolean isBookAvailable(Book book) {
        List<BookCopy> copies = repo.findByBook(book);
        return copies.stream().anyMatch(copy ->
            copy.getStatus() == BookStatus.AVAILABLE &&
            !copy.isReferenceOnly() &&
            copy.getCondition() != BookCondition.DAMAGED);
    }

    @Transactional(readOnly = true)
    public List<BookCopyResponse> getAvailableCopies() {
        var bookCopies = repo.findByStatus(BookStatus.AVAILABLE);
        return bookCopies.stream()
            .filter(copy -> !copy.isReferenceOnly() &&
                           (copy.getCondition() == null || copy.getCondition() != BookCondition.DAMAGED))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<BookCopyResponse> searchAvailable(String query, int size) {
        if (query == null || query.trim().isEmpty()) {
            // Return first 'size' available copies without filtering
            var bookCopies = repo.findByStatus(BookStatus.AVAILABLE);
            return bookCopies.stream()
                .filter(copy -> !copy.isReferenceOnly() &&
                               (copy.getCondition() == null || copy.getCondition() != BookCondition.DAMAGED))
                .limit(size)
                .map(this::toResponse)
                .toList();
        }

        var bookCopies = repo.findByStatus(BookStatus.AVAILABLE);
        return bookCopies.stream()
            .filter(copy -> !copy.isReferenceOnly() &&
                           (copy.getCondition() == null || copy.getCondition() != BookCondition.DAMAGED))
            .filter(copy -> {
                try {
                    Book book = copy.getBook();
                    if (book == null) return false;

                    String title = book.getTitle() != null ? book.getTitle().toLowerCase() : "";
                    String authorName = book.getAuthor() != null && book.getAuthor().getName() != null
                        ? book.getAuthor().getName().toLowerCase() : "";
                    String isbn = book.getIsbn() != null ? book.getIsbn().toLowerCase() : "";
                    String barcode = copy.getBarcode() != null ? copy.getBarcode().toLowerCase() : "";

                    String lowerQuery = query.toLowerCase();
                    return title.contains(lowerQuery) ||
                           authorName.contains(lowerQuery) ||
                           isbn.contains(lowerQuery) ||
                           barcode.contains(lowerQuery);
                } catch (Exception e) {
                    // Skip this copy if there's any issue with the data
                    return false;
                }
            })
            .limit(size)
            .map(this::toResponse)
            .toList();
    }
}