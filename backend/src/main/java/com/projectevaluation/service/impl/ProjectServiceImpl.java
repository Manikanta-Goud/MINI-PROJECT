package com.projectevaluation.service.impl;

import com.projectevaluation.dto.ProjectDTOs;
import com.projectevaluation.dto.UserDTO;
import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ResourceNotFoundException;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationServiceImpl notificationService;
    private final ActivityLogServiceImpl activityLogService;

    @Transactional
    public ProjectDTOs.ProjectDTO createProject(String creatorEmail, ProjectDTOs.CreateProjectRequest request) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", creatorEmail));

        String projectCode = generateProjectCode(request.getDomain());

        Project project = Project.builder()
                .projectCode(projectCode)
                .title(request.getTitle())
                .description(request.getDescription())
                .domain(request.getDomain())
                .technologyStack(request.getTechnologyStack())
                .academicYear(request.getAcademicYear())
                .semester(request.getSemester())
                .student(creator)
                .status(Project.ProjectStatus.DRAFT)
                .build();

        if (request.getMentorId() != null) {
            User mentor = userRepository.findById(request.getMentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor", "id", request.getMentorId()));
            project.setMentor(mentor);
        }

        project = projectRepository.save(project);

        // Add team members
        if (request.getTeamMembers() != null) {
            for (ProjectDTOs.TeamMemberRequest memberReq : request.getTeamMembers()) {
                User memberUser = userRepository.findById(memberReq.getStudentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Student", "id", memberReq.getStudentId()));
                ProjectMember member = ProjectMember.builder()
                        .project(project)
                        .student(memberUser)
                        .role(memberReq.getRole())
                        .build();
                project.getMembers().add(member);
            }
            project = projectRepository.save(project);
        }

        activityLogService.log(creator, project, "PROJECT_CREATED",
                creator.getFullName() + " created project: " + project.getTitle());

        return toDTO(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectDTOs.ProjectSummaryDTO> getProjectsForStudent(String email) {
        User student = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        List<Project> projects = projectRepository.findByStudentId(student.getId());
        // Also include projects where student is a member
        List<Project> memberProjects = projectRepository.findProjectsWhereStudentIsMember(student.getId());
        projects.addAll(memberProjects.stream()
                .filter(p -> projects.stream().noneMatch(ep -> ep.getId().equals(p.getId())))
                .collect(Collectors.toList()));
        return projects.stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDTOs.ProjectSummaryDTO> getProjectsForMentor(String email) {
        User mentor = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return projectRepository.findByMentorId(mentor.getId())
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDTOs.ProjectSummaryDTO> getProjectsForClusterHead(String email) {
        User ch = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return projectRepository.findByClusterHeadId(ch.getId())
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDTOs.ProjectSummaryDTO> getAllProjects() {
        return projectRepository.findAll()
                .stream().map(this::toSummaryDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDTOs.ProjectDTO getProjectById(Long id) {
        return toDTO(projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id)));
    }

    @Transactional
    public ProjectDTOs.ProjectDTO updateProject(Long id, String userEmail, ProjectDTOs.UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getDomain() != null) project.setDomain(request.getDomain());
        if (request.getTechnologyStack() != null) project.setTechnologyStack(request.getTechnologyStack());
        if (request.getAcademicYear() != null) project.setAcademicYear(request.getAcademicYear());
        if (request.getSemester() != null) project.setSemester(request.getSemester());

        if (request.getMentorId() != null) {
            User mentor = userRepository.findById(request.getMentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor", "id", request.getMentorId()));
            project.setMentor(mentor);
        }
        if (request.getClusterHeadId() != null) {
            User ch = userRepository.findById(request.getClusterHeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cluster Head", "id", request.getClusterHeadId()));
            project.setClusterHead(ch);
        }

        return toDTO(projectRepository.save(project));
    }

    private String generateProjectCode(String domain) {
        String prefix = domain != null ? domain.substring(0, Math.min(3, domain.length())).toUpperCase() : "PRJ";
        String code;
        do {
            code = prefix + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (projectRepository.existsByProjectCode(code));
        return code;
    }

    public ProjectDTOs.ProjectDTO toDTO(Project project) {
        ProjectDTOs.ProjectDTO dto = new ProjectDTOs.ProjectDTO();
        dto.setId(project.getId());
        dto.setProjectCode(project.getProjectCode());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setDomain(project.getDomain());
        dto.setTechnologyStack(project.getTechnologyStack());
        dto.setAcademicYear(project.getAcademicYear());
        dto.setSemester(project.getSemester());
        dto.setStatus(project.getStatus().name());
        dto.setStudent(UserDTO.from(project.getStudent()));
        dto.setMentor(UserDTO.from(project.getMentor()));
        dto.setClusterHead(UserDTO.from(project.getClusterHead()));
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());

        if (project.getMembers() != null) {
            dto.setMembers(project.getMembers().stream().map(m -> {
                ProjectDTOs.ProjectMemberDTO mDto = new ProjectDTOs.ProjectMemberDTO();
                mDto.setId(m.getId());
                mDto.setStudent(UserDTO.from(m.getStudent()));
                mDto.setRole(m.getRole());
                return mDto;
            }).collect(Collectors.toList()));
        }

        dto.setSubmissionCount((int) submissionRepository.countByProjectId(project.getId()));
        return dto;
    }

    public ProjectDTOs.ProjectSummaryDTO toSummaryDTO(Project project) {
        ProjectDTOs.ProjectSummaryDTO dto = new ProjectDTOs.ProjectSummaryDTO();
        dto.setId(project.getId());
        dto.setProjectCode(project.getProjectCode());
        dto.setTitle(project.getTitle());
        dto.setDomain(project.getDomain());
        dto.setStatus(project.getStatus().name());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        if (project.getStudent() != null) dto.setStudentName(project.getStudent().getFullName());
        if (project.getMentor() != null) dto.setMentorName(project.getMentor().getFullName());
        dto.setSubmissionCount((int) submissionRepository.countByProjectId(project.getId()));
        return dto;
    }
}
