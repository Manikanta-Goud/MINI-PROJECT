package com.projectevaluation.dto;

import com.projectevaluation.entity.Review;
import com.projectevaluation.entity.Submission;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

public class SubmissionDTOs {

    @Data
    public static class SubmissionDTO {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private String projectCode;
        private Integer versionNumber;
        private String fileName;
        private Long fileSize;
        private String contentType;
        private String submissionType;
        private UserDTO submittedBy;
        private LocalDateTime submissionDate;
        private String status;
        private String remarks;
        private ReviewDTOs.ReviewDTO review;
        private LocalDateTime createdAt;
    }
}
