package com.projectevaluation.service;

import com.projectevaluation.dto.AuthDTOs;
import com.projectevaluation.dto.UserDTO;

public interface AuthService {
    AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request);
    UserDTO register(AuthDTOs.RegisterRequest request);
    UserDTO getCurrentUser(String email);
    void changePassword(String email, AuthDTOs.ChangePasswordRequest request);
}
