package com.projectevaluation.dto;

import com.projectevaluation.entity.Role;
import com.projectevaluation.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String rollNumber;
    private String department;
    private String phone;
    private String profileImage;
    private String roleName;
    private Boolean active;
    private LocalDateTime createdAt;

    public static UserDTO from(User user) {
        if (user == null) return null;
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRollNumber(user.getRollNumber());
        dto.setDepartment(user.getDepartment());
        dto.setPhone(user.getPhone());
        dto.setProfileImage(user.getProfileImage());
        dto.setActive(user.getActive());
        dto.setCreatedAt(user.getCreatedAt());
        if (user.getRole() != null) {
            dto.setRoleName(user.getRole().getName().name());
        }
        return dto;
    }
}
