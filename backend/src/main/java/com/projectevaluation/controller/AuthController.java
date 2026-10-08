package com.projectevaluation.controller;

import com.projectevaluation.dto.AuthDTOs;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, register, and user profile endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<?>> register(@Valid @RequestBody AuthDTOs.RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Registration successful", authService.register(request)));
    }

    @GetMapping("/me")
    @Operation(summary = "Get currently authenticated user")
    public ResponseEntity<ApiResponse<?>> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated", "UNAUTHORIZED"));
        }
        try {
            return ResponseEntity.ok(ApiResponse.success(authService.getCurrentUser(authentication.getName())));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(ApiResponse.error("Session expired. Please log in again.", "UNAUTHORIZED"));
        }
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody AuthDTOs.ChangePasswordRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.<Void>builder()
                    .success(false).message("Not authenticated").build());
        }
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .success(true).message("Password changed successfully").build());
    }
}