package com.projectevaluation.service.impl;

import com.projectevaluation.dto.ReviewDTOs;
import com.projectevaluation.dto.UserDTO;
import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ResourceNotFoundException;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl {

    private final ReviewRepository reviewRepository;
    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationServiceImpl notificationService;
    private final ActivityLogServiceImpl activityLogService;

    @Transactional
    public ReviewDTOs.ReviewDTO createReview(String reviewerEmail, ReviewDTOs.CreateReviewRequest request) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", reviewerEmail));

        Submission submission = submissionRepository.findById(request.getSubmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", request.getSubmissionId()));

        Project project = submission.getProject();

        if (reviewRepository.findBySubmissionId(submission.getId()).isPresent()) {
            throw new IllegalStateException("This submission has already been reviewed");
        }

        double overall = (request.getTechnicalScore() + request.getDocumentationScore() +
                request.getInnovationScore() + request.getPresentationScore()) / 4.0;

        Review.ReviewerRole reviewerRole = determineReviewerRole(reviewer);

        Review review = Review.builder()
                .submission(submission)
                .reviewer(reviewer)
                .reviewerRole(reviewerRole)
                .comments(request.getComments())
                .technicalScore(request.getTechnicalScore())
                .documentationScore(request.getDocumentationScore())
                .innovationScore(request.getInnovationScore())
                .presentationScore(request.getPresentationScore())
                .overallScore(overall)
                .recommendation(request.getRecommendation())
                .build();

        review = reviewRepository.save(review);

        // Update submission status and project status based on recommendation
        updateStatusAfterReview(submission, project, reviewer, request.getRecommendation(), reviewerRole);

        return toDTO(review);
    }

    private void updateStatusAfterReview(Submission submission, Project project, User reviewer,
                                           Review.Recommendation recommendation, Review.ReviewerRole reviewerRole) {
        User student = project.getStudent();
        String notifTitle, notifMsg, logAction;

        if (reviewerRole == Review.ReviewerRole.MENTOR) {
            switch (recommendation) {
                case APPROVE -> {
                    submission.setStatus(Submission.SubmissionStatus.APPROVED);
                    project.setStatus(Project.ProjectStatus.MENTOR_APPROVED);
                    notifTitle = "Mentor Approved Your Project";
                    notifMsg = "Your project '" + project.getTitle() + "' has been approved by your mentor and forwarded to the Cluster Head.";
                    logAction = "MENTOR_APPROVED";

                    // Notify cluster head
                    if (project.getClusterHead() != null) {
                        notificationService.sendNotification(project.getClusterHead(),
                                "Project Requires Your Approval",
                                "Mentor-approved project '" + project.getTitle() + "' is ready for your review.",
                                Notification.NotificationType.APPROVAL, project.getId());
                        project.setStatus(Project.ProjectStatus.UNDER_CLUSTER_HEAD_REVIEW);
                    }
                }
                case REQUEST_CHANGES -> {
                    submission.setStatus(Submission.SubmissionStatus.CHANGES_REQUESTED);
                    project.setStatus(Project.ProjectStatus.MENTOR_CHANGES_REQUESTED);
                    notifTitle = "Changes Requested for Your Project";
                    notifMsg = "Your mentor has requested changes for project '" + project.getTitle() + "'. Please review the feedback and upload a revised version.";
                    logAction = "MENTOR_REQUESTED_CHANGES";
                }
                case REJECT -> {
                    submission.setStatus(Submission.SubmissionStatus.REJECTED);
                    project.setStatus(Project.ProjectStatus.REJECTED);
                    notifTitle = "Project Submission Rejected";
                    notifMsg = "Your project '" + project.getTitle() + "' has been rejected by your mentor.";
                    logAction = "MENTOR_REJECTED";
                }
                default -> throw new IllegalArgumentException("Unknown recommendation");
            }
        } else { // CLUSTER_HEAD
            switch (recommendation) {
                case APPROVE -> {
                    submission.setStatus(Submission.SubmissionStatus.APPROVED);
                    project.setStatus(Project.ProjectStatus.CLUSTER_HEAD_APPROVED);
                    notifTitle = "Cluster Head Approved Your Project";
                    notifMsg = "Your project '" + project.getTitle() + "' has been approved by the Cluster Head. It will now proceed to final evaluation.";
                    logAction = "CLUSTER_HEAD_APPROVED";
                    project.setStatus(Project.ProjectStatus.UNDER_FINAL_EVALUATION);
                }
                case REQUEST_CHANGES -> {
                    submission.setStatus(Submission.SubmissionStatus.CHANGES_REQUESTED);
                    project.setStatus(Project.ProjectStatus.CLUSTER_HEAD_CHANGES_REQUESTED);
                    notifTitle = "Changes Requested by Cluster Head";
                    notifMsg = "The Cluster Head has requested changes for project '" + project.getTitle() + "'.";
                    logAction = "CLUSTER_HEAD_REQUESTED_CHANGES";
                }
                case REJECT -> {
                    submission.setStatus(Submission.SubmissionStatus.REJECTED);
                    project.setStatus(Project.ProjectStatus.REJECTED);
                    notifTitle = "Project Rejected by Cluster Head";
                    notifMsg = "Your project '" + project.getTitle() + "' has been rejected by the Cluster Head.";
                    logAction = "CLUSTER_HEAD_REJECTED";
                }
                default -> throw new IllegalArgumentException("Unknown recommendation");
            }
        }

        submissionRepository.save(submission);
        projectRepository.save(project);

        if (student != null) {
            notificationService.sendNotification(student, notifTitle, notifMsg,
                    recommendation == Review.Recommendation.APPROVE
                            ? Notification.NotificationType.APPROVAL
                            : recommendation == Review.Recommendation.REQUEST_CHANGES
                            ? Notification.NotificationType.CHANGE_REQUEST
                            : Notification.NotificationType.REVIEW,
                    project.getId());
        }

        activityLogService.log(reviewer, project, logAction,
                reviewer.getFullName() + " reviewed project '" + project.getTitle() + "': " + recommendation.name());
    }

    private Review.ReviewerRole determineReviewerRole(User reviewer) {
        return switch (reviewer.getRole().getName()) {
            case CLUSTER_HEAD -> Review.ReviewerRole.CLUSTER_HEAD;
            default -> Review.ReviewerRole.MENTOR;
        };
    }

    @Transactional(readOnly = true)
    public List<ReviewDTOs.ReviewDTO> getReviewsForProject(Long projectId) {
        return reviewRepository.findBySubmission_ProjectIdOrderByCreatedAtDesc(projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ReviewDTOs.ReviewDTO toDTO(Review r) {
        ReviewDTOs.ReviewDTO dto = new ReviewDTOs.ReviewDTO();
        dto.setId(r.getId());
        if (r.getSubmission() != null) dto.setSubmissionId(r.getSubmission().getId());
        dto.setReviewer(UserDTO.from(r.getReviewer()));
        dto.setReviewerRole(r.getReviewerRole() != null ? r.getReviewerRole().name() : null);
        dto.setComments(r.getComments());
        dto.setTechnicalScore(r.getTechnicalScore());
        dto.setDocumentationScore(r.getDocumentationScore());
        dto.setInnovationScore(r.getInnovationScore());
        dto.setPresentationScore(r.getPresentationScore());
        dto.setOverallScore(r.getOverallScore());
        dto.setRecommendation(r.getRecommendation() != null ? r.getRecommendation().name() : null);
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}
