package com.sliit.library.controller;

import java.util.List;

import org.springframework.http.HttpStatus;  
import org.springframework.web.bind.annotation.*;

import com.sliit.library.service.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import com.sliit.library.dto.CategoryDto.*;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryCreateRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public CategoryResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<CategoryResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.get(page, pageSize);
    }

    @GetMapping("/search")
    public List<CategoryResponse> search(@RequestParam String query, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.search(query, page, pageSize);
    }

    @PatchMapping("/{id}")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
