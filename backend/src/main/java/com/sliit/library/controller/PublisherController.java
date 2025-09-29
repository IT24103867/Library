package com.sliit.library.controller;

import java.util.List;
import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.sliit.library.service.PublisherService;
import com.sliit.library.service.ImageUploadService;

import lombok.RequiredArgsConstructor;

import com.sliit.library.dto.PublisherDto.*;

@RestController
@RequestMapping("/api/publishers")
@RequiredArgsConstructor
public class PublisherController {

    private final PublisherService service;
    private final ImageUploadService imageUploadService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublisherResponse create(
        @RequestParam("name") String name,
        @RequestParam(value = "address", required = false) String address,
        @RequestParam(value = "contactNumber", required = false) String contactNumber,
        @RequestParam(value = "email", required = false) String email,
        @RequestParam(value = "website", required = false) String website,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "picture", required = false) MultipartFile picture) throws IOException {

        String pictureUrl = null;
        if (picture != null && !picture.isEmpty()) {
            pictureUrl = imageUploadService.uploadPublisherPicture(picture);
        }

        PublisherCreateRequest req = new PublisherCreateRequest(name, address, contactNumber, email, website, pictureUrl, description);
        return service.create(req);
    }

    @GetMapping("/{id}")
    public PublisherResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<PublisherResponse> list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.get(page, pageSize);
    }

    @GetMapping("/search")
    public List<PublisherResponse> search(@RequestParam String query, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int pageSize) {
        return service.search(query, page, pageSize);
    }

    @PatchMapping("/{id}")
    public PublisherResponse update(
        @PathVariable Long id,
        @RequestParam(value = "name", required = false) String name,
        @RequestParam(value = "address", required = false) String address,
        @RequestParam(value = "contactNumber", required = false) String contactNumber,
        @RequestParam(value = "email", required = false) String email,
        @RequestParam(value = "website", required = false) String website,
        @RequestParam(value = "description", required = false) String description,
        @RequestParam(value = "picture", required = false) MultipartFile picture) throws IOException {

        String pictureUrl = null;
        if (picture != null && !picture.isEmpty()) {
            pictureUrl = imageUploadService.uploadPublisherPicture(picture);
        }

        PublisherUpdateRequest req = new PublisherUpdateRequest(name, address, contactNumber, email, website, pictureUrl, description);
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}