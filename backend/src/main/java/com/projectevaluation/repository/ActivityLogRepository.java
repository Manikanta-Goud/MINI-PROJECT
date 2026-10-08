package com.projectevaluation.repository;

import com.projectevaluation.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByProjectIdOrderByTimestampDesc(Long projectId);
    Page<ActivityLog> findByUserIdOrderByTimestampDesc(Long userId, Pageable pageable);
    Page<ActivityLog> findAllByOrderByTimestampDesc(Pageable pageable);
}
