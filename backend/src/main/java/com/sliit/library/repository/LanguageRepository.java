package com.sliit.library.repository;

import com.sliit.library.model.Language;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LanguageRepository extends JpaRepository<Language, Long> {
    Optional<Language> findById(Long id);
    boolean existsByName(String name);
    boolean existsByCode(String code);
    Optional<Language> findByName(String name);
    Optional<Language> findByCode(String code);

    @Query("""
        SELECT l FROM Language l
        WHERE :search IS NULL OR :search = '' OR
              LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%')) OR
              LOWER(l.code) LIKE LOWER(CONCAT('%', :search, '%'))
    """)
    List<Language> search(@Param("search") String search, Pageable pageable);
}