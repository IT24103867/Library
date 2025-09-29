package com.sliit.library.repository;

import com.sliit.library.model.Book;
import com.sliit.library.model.BookCopy;
import com.sliit.library.model.BookStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    Optional<BookCopy> findById(Long id);
    boolean existsByBarcode(String barcode);
    List<BookCopy> findByBookId(Long bookId);
    List<BookCopy> findByBook(Book book);
    List<BookCopy> findByStatus(BookStatus status);
    Optional<BookCopy> findByBarcode(String barcode);
}
