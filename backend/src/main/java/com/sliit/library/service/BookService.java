package com.sliit.library.service;

import java.time.LocalDateTime;
import java.util.List;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import com.sliit.library.dto.BookDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Book;
import com.sliit.library.repository.AuthorRepository;
import com.sliit.library.repository.BookRepository;
import com.sliit.library.repository.CategoryRepository;
import com.sliit.library.repository.LanguageRepository;
import com.sliit.library.repository.PublisherRepository;
import com.sliit.library.service.BookReviewService;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class BookService {

    private final BookRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;
    private final AuthorRepository authorRepository;
    private final PublisherRepository publisherRepository;
    private final CategoryRepository categoryRepository;
    private final LanguageRepository languageRepository;
    private final BookReviewService bookReviewService;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public BookService(BookRepository repo, ActivityService activityService, CurrentUser currentUser,
            AuthorRepository authorRepository, PublisherRepository publisherRepository,
            CategoryRepository categoryRepository, LanguageRepository languageRepository,
            BookReviewService bookReviewService) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
        this.authorRepository = authorRepository;
        this.publisherRepository = publisherRepository;
        this.categoryRepository = categoryRepository;
        this.languageRepository = languageRepository;
        this.bookReviewService = bookReviewService;
    }

    @Transactional
    public BookResponse create(BookCreateRequest req) {
        if (repo.existsByIsbn(req.isbn())) {
            throw new ApiException("ISBN already exists");
        }

        var book = new Book();
        book.setTitle(req.title());
        book.setAuthor(authorRepository.findById(req.authorId())
                .orElseThrow(() -> new ApiException("Author not found")));
        book.setPublisher(publisherRepository.findById(req.publisherId())
                .orElseThrow(() -> new ApiException("Publisher not found")));
        book.setIsbn(req.isbn());
        book.setYear(req.year());
        book.setLanguage(languageRepository.findById(req.languageId())
                .orElseThrow(() -> new ApiException("Language not found")));
        book.setCategory(categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ApiException("Category not found")));
        book.setDescription(req.description());
        book.setCoverImage(req.coverImage());
        book.setCreatedAt(LocalDateTime.now());
        book.setUpdatedAt(LocalDateTime.now());
        var saved = repo.save(book);
        activityService.log(currentUser.require(), ActivityType.BOOK_CREATED, "Book " + book.getTitle() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookResponse getById(Long id) {
        var book = repo.findById(id).orElseThrow(() -> new ApiException("Book not found"));
        return toResponse(book);
    }

    public Book getBookEntityById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ApiException("Book not found"));
    }

    @Transactional(readOnly = true)
    public List<BookSummaryResponse> get(int page, int pageSize) {
        if (page == 0) {
            var books = repo.findAll();
            return books.stream().map(this::toSummaryResponse).toList();
        }
        var books = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return books.stream().map(this::toSummaryResponse).toList();
    }

    public BookResponse update(Long id, BookUpdateRequest req) {

        var book = repo.findById(id).orElseThrow(() -> new ApiException("Book not found"));

        if (req.title() != null)
            book.setTitle(req.title());
        if (req.authorId() != null)
            book.setAuthor(authorRepository.findById(req.authorId())
                    .orElseThrow(() -> new ApiException("Author not found")));
        if (req.publisherId() != null)
            book.setPublisher(publisherRepository.findById(req.publisherId())
                    .orElseThrow(() -> new ApiException("Publisher not found")));
        if (req.isbn() != null)
            book.setIsbn(req.isbn());
        if (req.year() != null)
            book.setYear(req.year());
        if (req.languageId() != null)
            book.setLanguage(languageRepository.findById(req.languageId())
                    .orElseThrow(() -> new ApiException("Language not found")));
        if (req.categoryId() != null)
            book.setCategory(categoryRepository.findById(req.categoryId())
                    .orElseThrow(() -> new ApiException("Category not found")));
        if (req.description() != null)
            book.setDescription(req.description());
        if (req.coverImage() != null) {
            // Delete old cover image if it exists
            if (book.getCoverImage() != null) {
                deleteImage(book.getCoverImage());
            }
            book.setCoverImage(req.coverImage());
        }

        book.setUpdatedAt(LocalDateTime.now());

        activityService.log(currentUser.require(), ActivityType.BOOK_UPDATED, "Book " + book.getTitle() + " updated!");

        return toResponse(book);
    }

    public void delete(Long id) {
        var book = repo.findById(id).orElseThrow(() -> new ApiException("Book not found"));

        // Delete cover image if it exists
        if (book.getCoverImage() != null) {
            deleteImage(book.getCoverImage());
        }

        repo.delete(book);
        activityService.log(currentUser.require(), ActivityType.BOOK_DELETED, "Book " + book.getTitle() + " deleted!");
    }

    @Transactional(readOnly = true)
    public List<BookSummaryResponse> search(String query, Long category, Long author, Long publisher, Long language, int page, int pageSize) {
        if(page == 0) {
            var books = repo.search(query, category, author, publisher, language, PageRequest.of(0, Integer.MAX_VALUE));
            return books.stream().map(this::toSummaryResponse).toList();
        }
        var books = repo.search(query, category, author, publisher, language, PageRequest.of(page - 1, pageSize));
        return books.stream().map(this::toSummaryResponse).toList();
    }

    private BookResponse toResponse(Book book) {
        // Get rating information
        var reviewSummary = bookReviewService.getBookReviewSummary(book.getId());
        Double averageRating = reviewSummary != null ? reviewSummary.getAverageRating() : 0.0;
        Long totalReviews = reviewSummary != null ? reviewSummary.getTotalReviews() : 0L;

        return new BookResponse(book.getId(), book.getTitle(), book.getAuthor().getId(), book.getPublisher().getId(), book.getIsbn(),
                book.getYear(), book.getLanguage().getId(), book.getCategory().getId(), book.getDescription(), book.getCoverImage(),
                book.getCreatedAt(), book.getUpdatedAt(), averageRating, totalReviews,
                book.getAuthor().getName(), book.getPublisher().getName(), book.getCategory().getName(), book.getLanguage().getName());
    }

    private BookSummaryResponse toSummaryResponse(Book book) {
        // Get rating information
        var reviewSummary = bookReviewService.getBookReviewSummary(book.getId());
        Double averageRating = reviewSummary != null ? reviewSummary.getAverageRating() : 0.0;
        Long totalReviews = reviewSummary != null ? reviewSummary.getTotalReviews() : 0L;

        return new BookSummaryResponse(book.getId(), book.getTitle(), book.getIsbn(),
                book.getAuthor().getName(), book.getPublisher().getName(), book.getCategory().getName(), book.getLanguage().getName(),
                book.getYear(), book.getCoverImage(), averageRating, totalReviews, book.getCreatedAt());
    }

    private boolean deleteImage(String imageUrl) {
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
}
