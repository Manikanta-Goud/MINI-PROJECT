package com.projectevaluation.repository;

import com.projectevaluation.entity.SubmissionEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionEventRepository extends JpaRepository<SubmissionEvent, Long> {
    List<SubmissionEvent> findByPaperIdOrderByCreatedAtAsc(Long paperId);
}
