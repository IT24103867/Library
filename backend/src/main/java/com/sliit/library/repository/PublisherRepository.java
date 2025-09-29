package com.sliit.library.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sliit.library.model.Publisher;

public interface PublisherRepository extends JpaRepository<Publisher, Long> {
    Optional<Publisher> findById(Long id);

    @Query("""
        SELECT p FROM Publisher p
        WHERE :search IS NULL OR :search = '' OR
              LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
              LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<Publisher> search(@Param("search") String search, Pageable pageable);
}
