package com.projectevaluation.controller;

import com.projectevaluation.dto.ReviewDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.service.impl.ReviewServiceImpl;
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
@Tag(name = "Reviews", description = "Project review endpoints for mentors and cluster heads")
@SecurityRequirement(name = "bearerAuth")
public class ReviewController {

    private final ReviewServiceImpl reviewService;

    @PostMapping("/api/reviews")
    @Operation(summary = "Submit a review for a submission")
    public ResponseEntity<ApiResponse<ReviewDTOs.ReviewDTO>> createReview(
            Authentication auth,
            @Valid @RequestBody ReviewDTOs.CreateReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Review submitted successfully",
                reviewService.createReview(auth.getName(), request)));
    }

    @GetMapping("/api/projects/{projectId}/reviews")
    @Operation(summary = "Get all reviews for a project")
    public ResponseEntity<ApiResponse<List<ReviewDTOs.ReviewDTO>>> getProjectReviews(@PathVariable Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(reviewService.getReviewsForProject(projectId)));
    }
}
