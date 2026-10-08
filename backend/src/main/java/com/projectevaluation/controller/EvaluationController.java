package com.projectevaluation.controller;

import com.projectevaluation.dto.EvaluationDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.service.impl.EvaluationServiceImpl;
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
@RequiredArgsConstructor
@Tag(name = "Evaluations", description = "Final project evaluation endpoints")
@SecurityRequirement(name = "bearerAuth")
public class EvaluationController {

    private final EvaluationServiceImpl evaluationService;

    @PostMapping("/api/evaluations")
    @Operation(summary = "Submit final evaluation for a project")
    public ResponseEntity<ApiResponse<EvaluationDTOs.EvaluationDTO>> createEvaluation(
            Authentication auth,
            @Valid @RequestBody EvaluationDTOs.CreateEvaluationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Evaluation submitted successfully",
                evaluationService.createEvaluation(auth.getName(), request)));
    }

    @GetMapping("/api/projects/{projectId}/evaluations")
    @Operation(summary = "Get evaluations for a project")
    public ResponseEntity<ApiResponse<List<EvaluationDTOs.EvaluationDTO>>> getEvaluations(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(evaluationService.getEvaluationsForProject(projectId)));
    }
}
