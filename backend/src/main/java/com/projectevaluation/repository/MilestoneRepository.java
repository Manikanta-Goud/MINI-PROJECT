package com.projectevaluation.repository;

import com.projectevaluation.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderByDueDateAsc(Long projectId);
    long countByProjectIdAndStatus(Long projectId, Milestone.MilestoneStatus status);
}
