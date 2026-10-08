package com.projectevaluation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

public class EvaluationDTOs {

    @Data
    public static class CreateEvaluationRequest {
        @NotNull
        private Long projectId;

        @NotNull @Min(0) @Max(20)
        private Integer technicalScore;

        @NotNull @Min(0) @Max(20)
        private Integer innovationScore;

        @NotNull @Min(0) @Max(20)
        private Integer implementationScore;

        @NotNull @Min(0) @Max(20)
        private Integer documentationScore;

        @NotNull @Min(0) @Max(20)
        private Integer presentationScore;

        @NotNull @Min(0) @Max(20)
        private Integer vivaScore;

        private String remarks;
    }

    @Data
    public static class EvaluationDTO {
        private Long id;
        private Long projectId;
        private String projectTitle;
        private UserDTO evaluator;
        private Integer technicalScore;
        private Integer innovationScore;
        private Integer implementationScore;
        private Integer documentationScore;
        private Integer presentationScore;
        private Integer vivaScore;
        private Double totalScore;
        private String grade;
        private String remarks;
        private LocalDateTime evaluatedAt;
    }
}
