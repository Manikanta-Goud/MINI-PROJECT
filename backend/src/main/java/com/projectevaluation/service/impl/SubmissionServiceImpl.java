package com.projectevaluation.service.impl;

import com.projectevaluation.dto.SubmissionDTOs;
import com.projectevaluation.dto.UserDTO;
import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ResourceNotFoundException;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionServiceImpl {

    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileStorageServiceImpl fileStorageService;
    private final NotificationServiceImpl notificationService;
    private final ActivityLogServiceImpl activityLogService;

    @Transactional
    public SubmissionDTOs.SubmissionDTO createSubmission(String userEmail, Long projectId,
                                                          String submissionType, String remarks,
                                                          MultipartFile file) {
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        // Store file
        String filePath = fileStorageService.storeFile(file, "submissions");

        // Calculate next version
        int nextVersion = submissionRepository.findMaxVersionByProjectId(projectId)
                .map(v -> v + 1).orElse(1);

        Submission.SubmissionType type;
        try {
            type = Submission.SubmissionType.valueOf(submissionType.toUpperCase());
        } catch (IllegalArgumentException e) {
            type = nextVersion == 1 ? Submission.SubmissionType.INITIAL : Submission.SubmissionType.REVISED;
        }

        Submission submission = Submission.builder()
                .project(project)
                .versionNumber(nextVersion)
                .fileName(file.getOriginalFilename())
                .filePath(filePath)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .submissionType(type)
                .submittedBy(student)
                .submissionDate(LocalDateTime.now())
                .status(Submission.SubmissionStatus.PENDING)
                .remarks(remarks)
                .build();

        submission = submissionRepository.save(submission);

        // Update project status
        project.setStatus(Project.ProjectStatus.UNDER_MENTOR_REVIEW);
        projectRepository.save(project);

        // Notify mentor
        if (project.getMentor() != null) {
            notificationService.sendNotification(
                    project.getMentor(),
                    "New Submission Requires Review",
                    student.getFullName() + " submitted '" + project.getTitle() + "' (v" + nextVersion + ") for review.",
                    Notification.NotificationType.SUBMISSION,
                    project.getId());
        }

        // Notify student
        notificationService.sendNotification(student,
                "Submission Successful",
                "Your project paper has been submitted successfully (v" + nextVersion + ").",
                Notification.NotificationType.SUBMISSION, project.getId());

        activityLogService.log(student, project, "PAPER_SUBMITTED",
                student.getFullName() + " submitted paper v" + nextVersion + " for project: " + project.getTitle());

        return toDTO(submission);
    }

    @Transactional(readOnly = true)
    public List<SubmissionDTOs.SubmissionDTO> getSubmissionsForProject(Long projectId) {
        return submissionRepository.findByProjectIdOrderByVersionNumberDesc(projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionDTOs.SubmissionDTO getSubmissionById(Long id) {
        return toDTO(submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", id)));
    }

    public SubmissionDTOs.SubmissionDTO toDTO(Submission s) {
        SubmissionDTOs.SubmissionDTO dto = new SubmissionDTOs.SubmissionDTO();
        dto.setId(s.getId());
        if (s.getProject() != null) {
            dto.setProjectId(s.getProject().getId());
            dto.setProjectTitle(s.getProject().getTitle());
            dto.setProjectCode(s.getProject().getProjectCode());
        }
        dto.setVersionNumber(s.getVersionNumber());
        dto.setFileName(s.getFileName());
        dto.setFileSize(s.getFileSize());
        dto.setContentType(s.getContentType());
        dto.setSubmissionType(s.getSubmissionType() != null ? s.getSubmissionType().name() : null);
        dto.setSubmittedBy(UserDTO.from(s.getSubmittedBy()));
        dto.setSubmissionDate(s.getSubmissionDate());
        dto.setStatus(s.getStatus() != null ? s.getStatus().name() : null);
        dto.setRemarks(s.getRemarks());
        dto.setCreatedAt(s.getCreatedAt());
        return dto;
    }
}
