package com.projectevaluation.controller;

import com.projectevaluation.dto.ProjectDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.service.impl.ProjectServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectServiceImpl projectService;

    @PostMapping
    @Operation(summary = "Create a new project")
    public ResponseEntity<ApiResponse<ProjectDTOs.ProjectDTO>> createProject(
            Authentication auth,
            @Valid @RequestBody ProjectDTOs.CreateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project created successfully",
                projectService.createProject(auth.getName(), request)));
    }

    @GetMapping
    @Operation(summary = "Get projects (filtered by role)")
    public ResponseEntity<ApiResponse<List<ProjectDTOs.ProjectSummaryDTO>>> getProjects(Authentication auth) {
        // Service will be called based on role context; for admin, return all
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ApiResponse<ProjectDTOs.ProjectDTO>> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update project")
    public ResponseEntity<ApiResponse<ProjectDTOs.ProjectDTO>> updateProject(
            @PathVariable Long id,
            Authentication auth,
            @RequestBody ProjectDTOs.UpdateProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully",
                projectService.updateProject(id, auth.getName(), request)));
    }
}
