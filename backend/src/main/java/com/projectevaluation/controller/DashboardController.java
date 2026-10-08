package com.projectevaluation.controller;

import com.projectevaluation.dto.DashboardDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.service.impl.DashboardServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Role-specific dashboard data endpoints")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardServiceImpl dashboardService;

    @GetMapping("/student")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    @Operation(summary = "Get student dashboard data")
    public ResponseEntity<ApiResponse<DashboardDTOs.StudentDashboard>> getStudentDashboard(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStudentDashboard(auth.getName())));
    }

    @GetMapping("/mentor")
    @PreAuthorize("hasAnyRole('MENTOR', 'ADMIN')")
    @Operation(summary = "Get mentor dashboard data")
    public ResponseEntity<ApiResponse<DashboardDTOs.MentorDashboard>> getMentorDashboard(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getMentorDashboard(auth.getName())));
    }

    @GetMapping("/cluster-head")
    @PreAuthorize("hasAnyRole('CLUSTER_HEAD', 'ADMIN')")
    @Operation(summary = "Get cluster head dashboard data")
    public ResponseEntity<ApiResponse<DashboardDTOs.ClusterHeadDashboard>> getClusterHeadDashboard(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getClusterHeadDashboard(auth.getName())));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get admin dashboard with full analytics")
    public ResponseEntity<ApiResponse<DashboardDTOs.AdminDashboard>> getAdminDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getAdminDashboard()));
    }
}
