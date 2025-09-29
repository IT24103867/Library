package com.sliit.library.repository;

import com.sliit.library.model.Activity;
import com.sliit.library.model.ActivityType;
import com.sliit.library.model.ActivitySeverity;
import org.springframework.data.jpa.repository.*;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
  List<Activity> findByUserIdOrderByTimestampDesc(Long userId);
  List<Activity> findAllByOrderByTimestampDesc();
  List<Activity> findByTypeOrderByTimestampDesc(ActivityType type);
  List<Activity> findBySeverityOrderByTimestampDesc(ActivitySeverity severity);
}
