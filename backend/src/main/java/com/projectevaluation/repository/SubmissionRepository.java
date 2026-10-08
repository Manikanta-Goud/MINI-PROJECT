package com.projectevaluation.repository;

import com.projectevaluation.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByProjectIdOrderByVersionNumberDesc(Long projectId);

    @Query("SELECT MAX(s.versionNumber) FROM Submission s WHERE s.project.id = :projectId")
    Optional<Integer> findMaxVersionByProjectId(@Param("projectId") Long projectId);

    List<Submission> findBySubmittedByIdOrderByCreatedAtDesc(Long userId);

    long countByProjectId(Long projectId);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.project.mentor.id = :mentorId AND s.status = :status")
    long countByMentorIdAndStatus(@Param("mentorId") Long mentorId,
                                   @Param("status") Submission.SubmissionStatus status);
}
