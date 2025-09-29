package com.sliit.library.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.PublisherDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Publisher;
import com.sliit.library.repository.PublisherRepository;
import com.sliit.library.service.ActivityService;
import com.sliit.library.service.ImageUploadService;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class PublisherService {

    private final PublisherRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;
    private final ImageUploadService imageUploadService;

    public PublisherService(PublisherRepository repo, ActivityService activityService, CurrentUser currentUser, ImageUploadService imageUploadService) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
        this.imageUploadService = imageUploadService;
    }

    @Transactional
    public PublisherResponse create(PublisherCreateRequest req) {
        var publisher = new Publisher();
        publisher.setName(req.name());
        publisher.setAddress(req.address());
        publisher.setContactNumber(req.contactNumber());
        publisher.setEmail(req.email());
        publisher.setWebsite(req.website());
        publisher.setPicture(req.picture());
        publisher.setDescription(req.description());
        publisher.setCreatedAt(LocalDateTime.now());
        publisher.setUpdatedAt(LocalDateTime.now());
        var saved = repo.save(publisher);
        activityService.log(currentUser.require(), ActivityType.PUBLISHER_CREATED, "Publisher " + publisher.getName() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PublisherResponse getById(Long id) {
        var publisher = repo.findById(id).orElseThrow(() -> new ApiException("Publisher not found"));
        return toResponse(publisher);
    }

    @Transactional(readOnly = true)
    public List<PublisherResponse> get(int page, int pageSize) {
        if (page == 0) {
            var publishers = repo.findAll();
            return publishers.stream().map(this::toResponse).toList();
        }
        var publishers = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return publishers.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PublisherResponse> search(String search, int page, int pageSize) {
        if (page == 0) {
            var publishers = repo.search(search, PageRequest.of(0, Integer.MAX_VALUE));
            return publishers.stream().map(this::toResponse).toList();
        }
        var publishers = repo.search(search, PageRequest.of(page - 1, pageSize));
        return publishers.stream().map(this::toResponse).toList();
    }

    public PublisherResponse update(Long id, PublisherUpdateRequest req) {
        var publisher = repo.findById(id).orElseThrow(() -> new ApiException("Publisher not found"));

        if (req.name() != null)
            publisher.setName(req.name());
        if (req.address() != null)
            publisher.setAddress(req.address());
        if (req.contactNumber() != null)
            publisher.setContactNumber(req.contactNumber());
        if (req.email() != null)
            publisher.setEmail(req.email());
        if (req.website() != null)
            publisher.setWebsite(req.website());
        if (req.picture() != null) {
            // Delete old picture if it exists
            if (publisher.getPicture() != null) {
                imageUploadService.deletePublisherImages(publisher.getPicture());
            }
            publisher.setPicture(req.picture());
        }
        if (req.description() != null)
            publisher.setDescription(req.description());
        publisher.setUpdatedAt(LocalDateTime.now());

        activityService.log(currentUser.require(), ActivityType.PUBLISHER_UPDATED, "Publisher " + publisher.getName() + " updated!");

        return toResponse(publisher);
    }

    public void delete(Long id) {
        var publisher = repo.findById(id).orElseThrow(() -> new ApiException("Publisher not found"));

        // Delete picture if it exists
        if (publisher.getPicture() != null) {
            imageUploadService.deletePublisherImages(publisher.getPicture());
        }

        repo.delete(publisher);
        activityService.log(currentUser.require(), ActivityType.PUBLISHER_DELETED, "Publisher " + publisher.getName() + " deleted!");
    }

    private PublisherResponse toResponse(Publisher publisher) {
        return new PublisherResponse(publisher.getId(), publisher.getName(), publisher.getAddress(), publisher.getContactNumber(), publisher.getEmail(), publisher.getWebsite(), publisher.getPicture(), publisher.getDescription(), publisher.getCreatedAt(), publisher.getUpdatedAt());
    }
}
