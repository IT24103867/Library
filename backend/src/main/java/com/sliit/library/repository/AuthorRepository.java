package com.sliit.library.repository;

import com.sliit.library.model.Author;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findById(Long id);

    @Query("""
        SELECT a FROM Author a
        WHERE :search IS NULL OR :search = '' OR
              LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
              LOWER(a.biography) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<Author> search(@Param("search") String search, Pageable pageable);
} 
