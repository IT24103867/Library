package com.sliit.library.controller;

import java.util.List;
import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sliit.library.service.AuthorService;
import com.sliit.library.service.ImageUploadService;

import lombok.RequiredArgsConstructor;

import com.sliit.library.dto.AuthorDto.*;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService service;
    private final ImageUploadService imageUploadService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuthorResponse create(
        @RequestParam("name") String name,
        @RequestParam("biography") String biography,
        @RequestParam(value = "picture", required = false) MultipartFile picture) throws IOException {

        String pictureUrl = null;
        if (picture != null && !picture.isEmpty()) {
            pictureUrl = imageUploadService.uploadAuthorPicture(picture);
        }

        AuthorCreateRequest req = new AuthorCreateRequest(name, biography, pictureUrl);
        return service.create(req);
    }

    @GetMapping("/{id}")
    public AuthorResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<AuthorResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.get(page, pageSize);
    }

    @GetMapping("/search")
    public List<AuthorResponse> search(@RequestParam String query, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.search(query, page, pageSize);
    }

    @PatchMapping("/{id}")
    public AuthorResponse update(
        @PathVariable Long id,
        @RequestParam(value = "name", required = false) String name,
        @RequestParam(value = "biography", required = false) String biography,
        @RequestParam(value = "picture", required = false) MultipartFile picture) throws IOException {

        String pictureUrl = null;
        if (picture != null && !picture.isEmpty()) {
            pictureUrl = imageUploadService.uploadAuthorPicture(picture);
        }

        AuthorUpdateRequest req = new AuthorUpdateRequest(name, biography, pictureUrl);
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}