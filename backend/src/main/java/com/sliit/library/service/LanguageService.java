package com.sliit.library.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sliit.library.dto.LanguageDto.*;
import com.sliit.library.exception.ApiException;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.Language;
import com.sliit.library.repository.LanguageRepository;
import com.sliit.library.util.CurrentUser;

@Service
@Transactional
public class LanguageService {

    private final LanguageRepository repo;
    private final ActivityService activityService;
    private final CurrentUser currentUser;

    public LanguageService(LanguageRepository repo, ActivityService activityService, CurrentUser currentUser) {
        this.repo = repo;
        this.activityService = activityService;
        this.currentUser = currentUser;
    }

    @Transactional
    public LanguageResponse create(LanguageCreateRequest req) {
        var language = new Language();
        if (repo.existsByName(req.name())) {
            throw new ApiException("Language with name '" + req.name() + "' already exists");
        }
        if (req.code() != null && repo.existsByCode(req.code())) {
            throw new ApiException("Language with code '" + req.code() + "' already exists");
        }
        language.setName(req.name());
        language.setCode(req.code());
        var saved = repo.save(language);
        activityService.log(currentUser.require(), ActivityType.LANGUAGE_CREATED, "Language " + language.getName() + " created!");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LanguageResponse getById(Long id) {
        var language = repo.findById(id).orElseThrow(() -> new ApiException("Language not found"));
        return toResponse(language);
    }

    @Transactional(readOnly = true)
    public List<LanguageResponse> get(int page, int pageSize) {
        if (page == 0) {
            var languages = repo.findAll();
            return languages.stream().map(this::toResponse).toList();
        }
        var languages = repo.findAll(PageRequest.of(page - 1, pageSize)).getContent();
        return languages.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<LanguageResponse> search(String search, int page, int pageSize) {
        if (page == 0) {
            var languages = repo.search(search, PageRequest.of(0, Integer.MAX_VALUE));
            return languages.stream().map(this::toResponse).toList();
        }
        var languages = repo.search(search, PageRequest.of(page - 1, pageSize));
        return languages.stream().map(this::toResponse).toList();
    }

    public LanguageResponse update(Long id, LanguageUpdateRequest req) {
        var language = repo.findById(id).orElseThrow(() -> new ApiException("Language not found"));

        if (req.name() != null) {
            if (!req.name().equals(language.getName()) && repo.existsByName(req.name())) {
                throw new ApiException("Language with name '" + req.name() + "' already exists");
            }
            language.setName(req.name());
        }
        if (req.code() != null) {
            if (!req.code().equals(language.getCode()) && repo.existsByCode(req.code())) {
                throw new ApiException("Language with code '" + req.code() + "' already exists");
            }
            language.setCode(req.code());
        }

        activityService.log(currentUser.require(), ActivityType.LANGUAGE_UPDATED, "Language " + language.getName() + " updated!");

        return toResponse(language);
    }

    public void delete(Long id) {
        var language = repo.findById(id).orElseThrow(() -> new ApiException("Language not found"));
        repo.delete(language);
        activityService.log(currentUser.require(), ActivityType.LANGUAGE_DELETED, "Language " + language.getName() + " deleted!");
    }

    private LanguageResponse toResponse(Language language) {
        return new LanguageResponse(
            language.getId(),
            language.getName(),
            language.getCode(),
            language.getCreatedAt(),
            language.getUpdatedAt()
        );
    }
}