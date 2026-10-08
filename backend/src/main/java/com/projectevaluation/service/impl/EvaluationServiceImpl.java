package com.projectevaluation.service.impl;

import com.projectevaluation.dto.EvaluationDTOs;
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
public class EvaluationServiceImpl {

    private final EvaluationRepository evaluationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationServiceImpl notificationService;
    private final ActivityLogServiceImpl activityLogService;

    @Transactional
    public EvaluationDTOs.EvaluationDTO createEvaluation(String evaluatorEmail, EvaluationDTOs.CreateEvaluationRequest request) {
        User evaluator = userRepository.findByEmail(evaluatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", evaluatorEmail));
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        Evaluation evaluation = Evaluation.builder()
                .project(project)
                .evaluator(evaluator)
                .technicalScore(request.getTechnicalScore())
                .innovationScore(request.getInnovationScore())
                .implementationScore(request.getImplementationScore())
                .documentationScore(request.getDocumentationScore())
                .presentationScore(request.getPresentationScore())
                .vivaScore(request.getVivaScore())
                .remarks(request.getRemarks())
                .build();

        evaluation = evaluationRepository.save(evaluation);

        // Mark project as completed
        project.setStatus(Project.ProjectStatus.COMPLETED);
        projectRepository.save(project);

        // Notify student
        if (project.getStudent() != null) {
            notificationService.sendNotification(project.getStudent(),
                    "Final Evaluation Completed",
                    "Your project '" + project.getTitle() + "' has been evaluated. Grade: " + evaluation.getGrade() +
                    " (Score: " + String.format("%.1f", evaluation.getTotalScore()) + "%)",
                    Notification.NotificationType.EVALUATION, project.getId());
        }

        activityLogService.log(evaluator, project, "EVALUATION_COMPLETED",
                evaluator.getFullName() + " completed final evaluation for project '" + project.getTitle() +
                "'. Grade: " + evaluation.getGrade());

        return toDTO(evaluation);
    }

    @Transactional(readOnly = true)
    public List<EvaluationDTOs.EvaluationDTO> getEvaluationsForProject(Long projectId) {
        return evaluationRepository.findByProjectId(projectId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EvaluationDTOs.EvaluationDTO toDTO(Evaluation e) {
        EvaluationDTOs.EvaluationDTO dto = new EvaluationDTOs.EvaluationDTO();
        dto.setId(e.getId());
        if (e.getProject() != null) {
            dto.setProjectId(e.getProject().getId());
            dto.setProjectTitle(e.getProject().getTitle());
        }
        dto.setEvaluator(UserDTO.from(e.getEvaluator()));
        dto.setTechnicalScore(e.getTechnicalScore());
        dto.setInnovationScore(e.getInnovationScore());
        dto.setImplementationScore(e.getImplementationScore());
        dto.setDocumentationScore(e.getDocumentationScore());
        dto.setPresentationScore(e.getPresentationScore());
        dto.setVivaScore(e.getVivaScore());
        dto.setTotalScore(e.getTotalScore());
        dto.setGrade(e.getGrade());
        dto.setRemarks(e.getRemarks());
        dto.setEvaluatedAt(e.getEvaluatedAt());
        return dto;
    }
}
