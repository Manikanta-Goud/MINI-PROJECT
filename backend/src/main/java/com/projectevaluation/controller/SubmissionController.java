package com.projectevaluation.controller;

import com.projectevaluation.dto.SubmissionDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.SubmissionRepository;
import com.projectevaluation.service.impl.FileStorageServiceImpl;
import com.projectevaluation.service.impl.SubmissionServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Project paper submission endpoints")
@SecurityRequirement(name = "bearerAuth")
public class SubmissionController {

    private final SubmissionServiceImpl submissionService;
    private final FileStorageServiceImpl fileStorageService;
    private final SubmissionRepository submissionRepository;

    @PostMapping("/api/submissions")
    @Operation(summary = "Submit a project paper (PDF)")
    public ResponseEntity<ApiResponse<SubmissionDTOs.SubmissionDTO>> submitPaper(
            Authentication auth,
            @RequestParam("projectId") Long projectId,
            @RequestParam(value = "submissionType", defaultValue = "INITIAL") String submissionType,
            @RequestParam(value = "remarks", required = false) String remarks,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success("Paper submitted successfully",
                submissionService.createSubmission(auth.getName(), projectId, submissionType, remarks, file)));
    }

    @GetMapping("/api/submissions/{id}")
    @Operation(summary = "Get submission by ID")
    public ResponseEntity<ApiResponse<SubmissionDTOs.SubmissionDTO>> getSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.getSubmissionById(id)));
    }

    @GetMapping("/api/projects/{projectId}/submissions")
    @Operation(summary = "Get all submissions for a project")
    public ResponseEntity<ApiResponse<List<SubmissionDTOs.SubmissionDTO>>> getProjectSubmissions(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.getSubmissionsForProject(projectId)));
    }

    @GetMapping("/api/submissions/{id}/download")
    @Operation(summary = "Download submission PDF file")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        var submission = submissionRepository.findById(id)
                .orElseThrow(() -> new com.projectevaluation.exception.ResourceNotFoundException("Submission", "id", id));

        Resource resource = fileStorageService.loadFileAsResource(submission.getFilePath());

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + submission.getFileName() + "\"")
                .body(resource);
    }
}
