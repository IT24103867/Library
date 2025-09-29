package com.sliit.library.controller;

import com.sliit.library.dto.ActivityDto.*;
import com.sliit.library.service.ActivityService;
import com.sliit.library.util.CurrentUser;
import com.sliit.library.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

  private final ActivityService service;
  private final CurrentUser currentUser;
  
  public ActivityController(ActivityService service, CurrentUser currentUser) { 
    this.service = service; 
    this.currentUser = currentUser;
  }

  @GetMapping
  public List<ActivityResponse> getAll(@RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size) {
    User user = currentUser.require();
    return service.getAllActivities(user.getId(), page, size);
  }

  @GetMapping("/users/{id}")
  public List<ActivityResponse> getByUserId(@PathVariable Long id, @RequestParam(defaultValue = "10") int limit) {
    return service.getByUserId(id, limit);
  }

}
