package com.projectevaluation.repository;

import com.projectevaluation.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findBySubmission_ProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<Review> findBySubmissionId(Long submissionId);
    List<Review> findByReviewerId(Long reviewerId);

    @Query("SELECT AVG(r.overallScore) FROM Review r WHERE r.submission.project.mentor.id = :mentorId")
    Double avgScoreByMentorId(@Param("mentorId") Long mentorId);
}
