package com.projectevaluation.controller;

import com.projectevaluation.entity.Role;
import com.projectevaluation.entity.User;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepo;

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(@RequestParam(required = false) String role) {
        List<User> users = userRepo.findAll();
        if (role != null && !role.isBlank()) {
            try {
                Role.RoleName rn = Role.RoleName.valueOf(role.toUpperCase());
                users = users.stream().filter(u -> u.getRole().getName() == rn).collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {}
        }
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("email", u.getEmail());
            m.put("roleName", u.getRole().getName().name());
            m.put("active", u.getActive());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        List<User> all = userRepo.findAll();
        long mentors = all.stream().filter(u -> u.getRole().getName() == Role.RoleName.MENTOR).count();
        long clusters = all.stream().filter(u -> u.getRole().getName() == Role.RoleName.CLUSTER_HEAD).count();
        long students = all.stream().filter(u -> u.getRole().getName() == Role.RoleName.STUDENT).count();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("totalUsers", all.size());
        m.put("totalMentors", mentors);
        m.put("totalClusterHeads", clusters);
        m.put("totalStudents", students);
        return ResponseEntity.ok(ApiResponse.success(m));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        User u = userRepo.findById(id).orElseThrow();
        u.setActive(!Boolean.TRUE.equals(u.getActive()));
        userRepo.save(u);
        return ResponseEntity.ok(ApiResponse.success("User status updated"));
    }
}
