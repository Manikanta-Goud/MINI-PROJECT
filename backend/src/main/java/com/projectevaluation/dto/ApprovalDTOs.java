package com.projectevaluation.dto;

import com.projectevaluation.entity.Approval;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

public class ApprovalDTOs {

    @Data
    public static class CreateApprovalRequest {
        @NotNull(message = "Project ID is required")
        private Long projectId;

        private Long submissionId;

        private String comments;

        @NotNull(message = "Approval status is required")
        private Approval.ApprovalStatus status;
    }

    @Data
    public static class ApprovalDTO {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private UserDTO approver;
        private String approverRole;
        private String status;
        private String comments;
        private LocalDateTime approvedAt;
        private LocalDateTime createdAt;
    }
}
