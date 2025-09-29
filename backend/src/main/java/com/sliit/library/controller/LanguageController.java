package com.sliit.library.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.sliit.library.service.LanguageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import com.sliit.library.dto.LanguageDto.*;

@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
public class LanguageController {

    private final LanguageService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LanguageResponse create(@Valid @RequestBody LanguageCreateRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}")
    public LanguageResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<LanguageResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.get(page, pageSize);
    }

    @GetMapping("/search")
    public List<LanguageResponse> search(@RequestParam String query, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.search(query, page, pageSize);
    }

    @PatchMapping("/{id}")
    public LanguageResponse update(@PathVariable Long id, @Valid @RequestBody LanguageUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}