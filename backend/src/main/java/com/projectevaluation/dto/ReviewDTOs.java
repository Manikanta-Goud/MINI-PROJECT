package com.projectevaluation.dto;

import com.projectevaluation.entity.Review;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

public class ReviewDTOs {

    @Data
    public static class CreateReviewRequest {
        @NotNull(message = "Submission ID is required")
        private Long submissionId;

        private String comments;

        @NotNull(message = "Technical score is required")
        @Min(value = 0, message = "Score must be at least 0")
        @Max(value = 20, message = "Score must be at most 20")
        private Integer technicalScore;

        @NotNull(message = "Documentation score is required")
        @Min(0) @Max(20)
        private Integer documentationScore;

        @NotNull(message = "Innovation score is required")
        @Min(0) @Max(20)
        private Integer innovationScore;

        @NotNull(message = "Presentation score is required")
        @Min(0) @Max(20)
        private Integer presentationScore;

        @NotNull(message = "Recommendation is required")
        private Review.Recommendation recommendation;
    }

    @Data
    public static class ReviewDTO {
        private Long id;
        private Long submissionId;
        private UserDTO reviewer;
        private String reviewerRole;
        private String comments;
        private Integer technicalScore;
        private Integer documentationScore;
        private Integer innovationScore;
        private Integer presentationScore;
        private Double overallScore;
        private String recommendation;
        private LocalDateTime createdAt;
    }
}
