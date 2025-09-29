package com.sliit.library.repository;

import com.sliit.library.model.Book;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findById(Long id);
    Optional<Book> findByIsbn(String isbn);
    boolean existsByIsbn(String isbn);

    @Query("""
        SELECT b FROM Book b
        WHERE 
            (
                :search IS NULL OR :search = '' OR
                LOWER(b.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(b.author.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(b.publisher.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
                LOWER(b.isbn) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (:category IS NULL OR b.category.id = :category)
            AND (:author IS NULL OR b.author.id = :author)
            AND (:publisher IS NULL OR b.publisher.id = :publisher)
            AND (:language IS NULL OR b.language.id = :language)
    """)
    List<Book> search(
        @Param("search") String search,
        @Param("category") Long category,
        @Param("author") Long author,
        @Param("publisher") Long publisher,
        @Param("language") Long language,
        Pageable pageable
    );

    @Query("SELECT count(bc) FROM BookCopy bc WHERE bc.status = com.sliit.library.model.BookStatus.AVAILABLE")
    long countAvailableBooks();
}
