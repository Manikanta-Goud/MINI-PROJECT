package com.projectevaluation.service.impl;

import com.projectevaluation.dto.DashboardDTOs;
import com.projectevaluation.dto.NotificationDTO;
import com.projectevaluation.dto.ProjectDTOs;
import com.projectevaluation.dto.UserDTO;
import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ResourceNotFoundException;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SubmissionRepository submissionRepository;
    private final EvaluationRepository evaluationRepository;
    private final NotificationRepository notificationRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ProjectServiceImpl projectService;

    @Transactional(readOnly = true)
    public DashboardDTOs.StudentDashboard getStudentDashboard(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<Project> projects = projectRepository.findByStudentId(student.getId());

        long active = projects.stream()
                .filter(p -> p.getStatus() != Project.ProjectStatus.COMPLETED && p.getStatus() != Project.ProjectStatus.REJECTED)
                .count();
        long completed = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED).count();
        long pendingReview = projects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.UNDER_MENTOR_REVIEW).count();

        String latestStatus = projects.isEmpty() ? "No projects" : projects.get(0).getStatus().name();

        List<NotificationDTO> recentNotifs = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(student.getId())
                .stream().limit(5).map(NotificationDTO::from).collect(Collectors.toList());

        return DashboardDTOs.StudentDashboard.builder()
                .totalProjects((long) projects.size())
                .activeProjects(active)
                .pendingReviews(pendingReview)
                .completedProjects(completed)
                .latestProjectStatus(latestStatus)
                .recentProjects(projects.stream().limit(5).map(projectService::toSummaryDTO).collect(Collectors.toList()))
                .recentNotifications(recentNotifs)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDTOs.MentorDashboard getMentorDashboard(String email) {
        User mentor = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<Project> allProjects = projectRepository.findByMentorId(mentor.getId());
        List<Project> pendingReview = projectRepository.findByMentorIdAndStatusIn(mentor.getId(),
                List.of(Project.ProjectStatus.UNDER_MENTOR_REVIEW));
        long approved = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.MENTOR_APPROVED ||
                             p.getStatus() == Project.ProjectStatus.UNDER_CLUSTER_HEAD_REVIEW ||
                             p.getStatus() == Project.ProjectStatus.COMPLETED).count();
        long changesRequested = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.MENTOR_CHANGES_REQUESTED).count();

        Double avgScore = reviewRepository.avgScoreByMentorId(mentor.getId());

        List<NotificationDTO> recentNotifs = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(mentor.getId())
                .stream().limit(5).map(NotificationDTO::from).collect(Collectors.toList());

        return DashboardDTOs.MentorDashboard.builder()
                .assignedProjects((long) allProjects.size())
                .pendingReviews((long) pendingReview.size())
                .approvedProjects(approved)
                .changesRequested(changesRequested)
                .averageScore(avgScore)
                .pendingReviewProjects(pendingReview.stream().map(projectService::toSummaryDTO).collect(Collectors.toList()))
                .recentNotifications(recentNotifs)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDTOs.ClusterHeadDashboard getClusterHeadDashboard(String email) {
        User ch = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<Project> allProjects = projectRepository.findByClusterHeadId(ch.getId());
        List<Project> pendingApproval = projectRepository.findByClusterHeadIdAndStatusIn(ch.getId(),
                List.of(Project.ProjectStatus.UNDER_CLUSTER_HEAD_REVIEW, Project.ProjectStatus.MENTOR_APPROVED));
        long approved = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.CLUSTER_HEAD_APPROVED ||
                             p.getStatus() == Project.ProjectStatus.UNDER_FINAL_EVALUATION ||
                             p.getStatus() == Project.ProjectStatus.COMPLETED).count();
        long rejected = allProjects.stream()
                .filter(p -> p.getStatus() == Project.ProjectStatus.REJECTED).count();

        List<NotificationDTO> recentNotifs = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(ch.getId())
                .stream().limit(5).map(NotificationDTO::from).collect(Collectors.toList());

        return DashboardDTOs.ClusterHeadDashboard.builder()
                .totalProjects((long) allProjects.size())
                .pendingApprovals((long) pendingApproval.size())
                .approvedProjects(approved)
                .rejectedProjects(rejected)
                .averageScore(evaluationRepository.getAverageScore())
                .pendingApprovalProjects(pendingApproval.stream().map(projectService::toSummaryDTO).collect(Collectors.toList()))
                .recentNotifications(recentNotifs)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDTOs.AdminDashboard getAdminDashboard() {
        long totalStudents = userRepository.countByRole_Name(Role.RoleName.STUDENT);
        long totalMentors = userRepository.countByRole_Name(Role.RoleName.MENTOR);
        long totalCHs = userRepository.countByRole_Name(Role.RoleName.CLUSTER_HEAD);
        long totalProjects = projectRepository.count();

        long pendingReviews = projectRepository.findByStatus(Project.ProjectStatus.UNDER_MENTOR_REVIEW).size();
        long completed = projectRepository.findByStatus(Project.ProjectStatus.COMPLETED).size();
        long pendingApprovals = projectRepository.findByStatus(Project.ProjectStatus.UNDER_CLUSTER_HEAD_REVIEW).size();
        Double avgScore = evaluationRepository.getAverageScore();

        // Projects by status chart data
        List<Map<String, Object>> byStatus = projectRepository.countByStatus().stream()
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("status", row[0].toString());
                    m.put("count", row[1]);
                    return m;
                }).collect(Collectors.toList());

        // Projects by domain chart data
        List<Map<String, Object>> byDomain = projectRepository.countByDomain().stream()
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("domain", row[0] != null ? row[0].toString() : "Unknown");
                    m.put("count", row[1]);
                    return m;
                }).collect(Collectors.toList());

        // Grade distribution
        List<Map<String, Object>> gradeDistrib = evaluationRepository.countByGrade().stream()
                .map(row -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("grade", row[0] != null ? row[0].toString() : "N/A");
                    m.put("count", row[1]);
                    return m;
                }).collect(Collectors.toList());

        List<ProjectDTOs.ProjectSummaryDTO> recentProjects = projectRepository
                .findAll(PageRequest.of(0, 10, org.springframework.data.domain.Sort.by("createdAt").descending()))
                .stream().map(projectService::toSummaryDTO).collect(Collectors.toList());

        List<DashboardDTOs.ActivityLogDTO> recentActivity = activityLogRepository
                .findAllByOrderByTimestampDesc(PageRequest.of(0, 20))
                .stream().map(this::toActivityLogDTO).collect(Collectors.toList());

        return DashboardDTOs.AdminDashboard.builder()
                .totalStudents(totalStudents)
                .totalMentors(totalMentors)
                .totalClusterHeads(totalCHs)
                .totalProjects(totalProjects)
                .pendingReviews(pendingReviews)
                .completedProjects(completed)
                .pendingApprovals(pendingApprovals)
                .averageScore(avgScore)
                .projectsByStatus(byStatus)
                .projectsByDomain(byDomain)
                .gradeDistribution(gradeDistrib)
                .recentProjects(recentProjects)
                .recentActivity(recentActivity)
                .build();
    }

    private DashboardDTOs.ActivityLogDTO toActivityLogDTO(com.projectevaluation.entity.ActivityLog log) {
        DashboardDTOs.ActivityLogDTO dto = new DashboardDTOs.ActivityLogDTO();
        dto.setId(log.getId());
        dto.setUser(UserDTO.from(log.getUser()));
        if (log.getProject() != null) {
            dto.setProjectId(log.getProject().getId());
            dto.setProjectTitle(log.getProject().getTitle());
        }
        dto.setAction(log.getAction());
        dto.setDescription(log.getDescription());
        dto.setTimestamp(log.getTimestamp());
        return dto;
    }

    // Inject ReviewRepository for avg score calculation
    @org.springframework.beans.factory.annotation.Autowired
    private ReviewRepository reviewRepository;
}
