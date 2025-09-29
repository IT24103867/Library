package com.sliit.library.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.AuthorDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Author;
import com.sliit.library.repository.AuthorRepository;
import com.sliit.library.service.ActivityService;
import com.sliit.library.service.ImageUploadService;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class AuthorService {

    private final AuthorRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;
    private final ImageUploadService imageUploadService;

    public AuthorService(AuthorRepository repo, ActivityService activityService, CurrentUser currentUser, ImageUploadService imageUploadService) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
        this.imageUploadService = imageUploadService;
    }

    @Transactional
    public AuthorResponse create(AuthorCreateRequest req) {
        var author = new Author();
        author.setName(req.name());
        author.setBiography(req.biography());
        author.setPicture(req.picture());
        author.setCreatedAt(LocalDateTime.now());
        author.setUpdatedAt(LocalDateTime.now());
        var saved = repo.save(author);
        activityService.log(currentUser.require(), ActivityType.AUTHOR_CREATED, "Author " + author.getName() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthorResponse getById(Long id) {
        var author = repo.findById(id).orElseThrow(() -> new ApiException("Author not found"));
        return toResponse(author);
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> get(int page, int pageSize) {
        if (page == 0) {
            var authors = repo.findAll();
            return authors.stream().map(this::toResponse).toList();
        }
        var authors = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return authors.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AuthorResponse> search(String query, int page, int pageSize) {
        if (page == 0) {
            var authors = repo.search(query, PageRequest.of(0, Integer.MAX_VALUE));
            return authors.stream().map(this::toResponse).toList();
        }
        var authors = repo.search(query, PageRequest.of(page - 1, pageSize));
        return authors.stream().map(this::toResponse).toList();
    }

    public AuthorResponse update(Long id, AuthorUpdateRequest req) {
        var author = repo.findById(id).orElseThrow(() -> new ApiException("Author not found"));

        if (req.name() != null)
            author.setName(req.name());
        if (req.biography() != null)
            author.setBiography(req.biography());
        if (req.picture() != null) {
            // Delete old picture if it exists
            if (author.getPicture() != null) {
                imageUploadService.deleteAuthorImages(author.getPicture());
            }
            author.setPicture(req.picture());
        }
        author.setUpdatedAt(LocalDateTime.now());

        activityService.log(currentUser.require(), ActivityType.AUTHOR_UPDATED, "Author " + author.getName() + " updated!");

        return toResponse(author);
    }

    public void delete(Long id) {
        var author = repo.findById(id).orElseThrow(() -> new ApiException("Author not found"));

        // Delete picture if it exists
        if (author.getPicture() != null) {
            imageUploadService.deleteAuthorImages(author.getPicture());
        }

        repo.delete(author);
        activityService.log(currentUser.require(), ActivityType.AUTHOR_DELETED, "Author " + author.getName() + " deleted!");
    }

    private AuthorResponse toResponse(Author author) {
        return new AuthorResponse(author.getId(), author.getName(), author.getBiography(), author.getPicture(), author.getCreatedAt(), author.getUpdatedAt());
    }
}
