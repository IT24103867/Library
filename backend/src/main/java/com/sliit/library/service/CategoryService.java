package com.sliit.library.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.CategoryDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Category;
import com.sliit.library.repository.CategoryRepository;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;

    public CategoryService(CategoryRepository repo, ActivityService activityService, CurrentUser currentUser) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
    }

    @Transactional
    public CategoryResponse create(CategoryCreateRequest req) {
        var category = new Category();
        if (repo.existsByName(req.name())) {
            throw new ApiException("Category with name '" + req.name() + "' already exists");
        }
        category.setName(req.name());
        category.setCreatedAt(LocalDateTime.now());
        category.setUpdatedAt(LocalDateTime.now());
        var saved = repo.save(category);
        activityService.log(currentUser.require(), ActivityType.CATEGORY_CREATED, "Category " + category.getName() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        var category = repo.findById(id).orElseThrow(() -> new ApiException("Category not found"));
        return toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> get(int page, int pageSize) {
        if (page == 0) {
            var categories = repo.findAll();
            return categories.stream().map(this::toResponse).toList();
        }
        var categories = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return categories.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> search(String search, int page, int pageSize) {
        if (page == 0) {
            var categories = repo.search(search, PageRequest.of(0, Integer.MAX_VALUE));
            return categories.stream().map(this::toResponse).toList();
        }
        var categories = repo.search(search, PageRequest.of(page - 1, pageSize));
        return categories.stream().map(this::toResponse).toList();
    }

    public CategoryResponse update(Long id, CategoryUpdateRequest req) {
        var category = repo.findById(id).orElseThrow(() -> new ApiException("Category not found"));

        if (req.name() != null)
            category.setName(req.name());
        category.setUpdatedAt(LocalDateTime.now());

        activityService.log(currentUser.require(), ActivityType.CATEGORY_UPDATED, "Category " + category.getName() + " updated!");

        return toResponse(category);
    }

    public void delete(Long id) {
        var category = repo.findById(id).orElseThrow(() -> new ApiException("Category not found"));
        repo.delete(category);
        activityService.log(currentUser.require(), ActivityType.CATEGORY_DELETED, "Category " + category.getName() + " deleted!");
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getCreatedAt(), category.getUpdatedAt());
    }
}
