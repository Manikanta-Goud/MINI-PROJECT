package com.projectevaluation.service.impl;

import com.projectevaluation.entity.*;
import com.projectevaluation.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void log(User user, Project project, String action, String description) {
        ActivityLog log = ActivityLog.builder()
                .user(user)
                .project(project)
                .action(action)
                .description(description)
                .build();
        activityLogRepository.save(log);
    }
}
