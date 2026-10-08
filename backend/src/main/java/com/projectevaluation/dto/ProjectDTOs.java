package com.projectevaluation.dto;

import com.projectevaluation.entity.Project;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

public class ProjectDTOs {

    @Data
    public static class CreateProjectRequest {
        @NotBlank(message = "Project title is required")
        private String title;

        private String description;

        @NotBlank(message = "Domain is required")
        private String domain;

        private String technologyStack;
        private String academicYear;
        private String semester;
        private Long mentorId;
        private List<TeamMemberRequest> teamMembers;
    }

    @Data
    public static class TeamMemberRequest {
        @NotNull(message = "Student ID is required")
        private Long studentId;
        private String role;
    }

    @Data
    public static class UpdateProjectRequest {
        private String title;
        private String description;
        private String domain;
        private String technologyStack;
        private String academicYear;
        private String semester;
        private Long mentorId;
        private Long clusterHeadId;
    }

    @Data
    public static class ProjectDTO {
        private Long id;
        private String projectCode;
        private String title;
        private String description;
        private String domain;
        private String technologyStack;
        private String academicYear;
        private String semester;
        private String status;
        private UserDTO student;
        private UserDTO mentor;
        private UserDTO clusterHead;
        private List<ProjectMemberDTO> members;
        private Integer submissionCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data
    public static class ProjectMemberDTO {
        private Long id;
        private UserDTO student;
        private String role;
    }

    @Data
    public static class ProjectSummaryDTO {
        private Long id;
        private String projectCode;
        private String title;
        private String domain;
        private String status;
        private String studentName;
        private String mentorName;
        private Integer submissionCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
