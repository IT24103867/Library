package com.sliit.library.repository;
 
import com.sliit.library.model.Category;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findById(Long id);
    boolean existsByName(String name);

    @Query("""
        SELECT c FROM Category c
        WHERE :search IS NULL OR :search = '' OR
              LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<Category> search(@Param("search") String search, Pageable pageable);
} 
