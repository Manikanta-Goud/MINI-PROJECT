package com.projectevaluation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

public class DashboardDTOs {

    @Data
    @Builder
    public static class StudentDashboard {
        private Long totalProjects;
        private Long activeProjects;
        private Long pendingReviews;
        private Long completedProjects;
        private String latestProjectStatus;
        private List<ProjectDTOs.ProjectSummaryDTO> recentProjects;
        private List<NotificationDTO> recentNotifications;
    }

    @Data
    @Builder
    public static class MentorDashboard {
        private Long assignedProjects;
        private Long pendingReviews;
        private Long approvedProjects;
        private Long changesRequested;
        private Double averageScore;
        private List<ProjectDTOs.ProjectSummaryDTO> pendingReviewProjects;
        private List<NotificationDTO> recentNotifications;
    }

    @Data
    @Builder
    public static class ClusterHeadDashboard {
        private Long totalProjects;
        private Long pendingApprovals;
        private Long approvedProjects;
        private Long rejectedProjects;
        private Double averageScore;
        private List<ProjectDTOs.ProjectSummaryDTO> pendingApprovalProjects;
        private List<NotificationDTO> recentNotifications;
    }

    @Data
    @Builder
    public static class AdminDashboard {
        private Long totalStudents;
        private Long totalMentors;
        private Long totalClusterHeads;
        private Long totalProjects;
        private Long pendingReviews;
        private Long completedProjects;
        private Long pendingApprovals;
        private Double averageScore;
        private List<Map<String, Object>> projectsByStatus;
        private List<Map<String, Object>> projectsByDomain;
        private List<Map<String, Object>> gradeDistribution;
        private List<ProjectDTOs.ProjectSummaryDTO> recentProjects;
        private List<ActivityLogDTO> recentActivity;
    }

    @Data
    public static class ActivityLogDTO {
        private Long id;
        private UserDTO user;
        private Long projectId;
        private String projectTitle;
        private String action;
        private String description;
        private java.time.LocalDateTime timestamp;
    }
}
