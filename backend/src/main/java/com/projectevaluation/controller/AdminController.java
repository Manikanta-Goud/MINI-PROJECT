package com.projectevaluation.controller;

import com.projectevaluation.entity.Role;
import com.projectevaluation.entity.User;
import com.projectevaluation.entity.Cluster;
import com.projectevaluation.entity.Section;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.ClusterRepository;
import com.projectevaluation.repository.RoleRepository;
import com.projectevaluation.repository.SectionRepository;
import com.projectevaluation.repository.UserRepository;
import com.projectevaluation.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
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
    private final RoleRepository roleRepo;
    private final ClusterRepository clusterRepo;
    private final SectionRepository sectionRepo;
    private final PasswordEncoder passwordEncoder;
    private final TeamRepository teamRepo;

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

    @GetMapping("/clusters")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getClusters() {
        List<Map<String, Object>> result = clusterRepo.findAll().stream().map(this::clusterView).toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/clusters")
    @Transactional
    public ResponseEntity<?> createCluster(@RequestBody ClusterRequest request) {
        String name = required(request.name(), "Cluster name");
        if (clusterRepo.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Cluster already exists: " + name);
        }
        Cluster cluster = clusterRepo.save(Cluster.builder().name(name).build());
        return ResponseEntity.ok(ApiResponse.success(clusterView(cluster)));
    }

    @PutMapping("/clusters/{clusterId}")
    @Transactional
    public ResponseEntity<?> updateCluster(@PathVariable Long clusterId, @RequestBody ClusterRequest request) {
        Cluster cluster = clusterRepo.findById(clusterId).orElseThrow();
        String name = required(request.name(), "Cluster name");
        if (!cluster.getName().equalsIgnoreCase(name) && clusterRepo.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Cluster already exists: " + name);
        }
        cluster.setName(name);
        return ResponseEntity.ok(ApiResponse.success(clusterView(clusterRepo.save(cluster))));
    }

    @DeleteMapping("/clusters/{clusterId}")
    @Transactional
    public ResponseEntity<?> deleteCluster(@PathVariable Long clusterId) {
        Cluster cluster = clusterRepo.findById(clusterId).orElseThrow();
        if (!cluster.getSections().isEmpty()) {
            throw new IllegalStateException("Remove all sections before deleting this cluster");
        }
        clusterRepo.delete(cluster);
        return ResponseEntity.ok(ApiResponse.success("Cluster deleted"));
    }

    @PostMapping("/clusters/{clusterId}/sections")
    @Transactional
    public ResponseEntity<?> createSection(@PathVariable Long clusterId, @RequestBody NameRequest request) {
        Cluster cluster = clusterRepo.findById(clusterId).orElseThrow();
        String name = required(request.name(), "Section name");
        if (sectionRepo.existsByCluster_IdAndName(clusterId, name)) {
            throw new IllegalArgumentException("Section already exists: " + name);
        }
        Section section = sectionRepo.save(Section.builder().name(name).cluster(cluster).build());
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", section.getId(), "name", section.getName())));
    }

    @PutMapping("/clusters/{clusterId}/sections/{sectionId}")
    @Transactional
    public ResponseEntity<?> updateSection(@PathVariable Long clusterId, @PathVariable Long sectionId,
                                           @RequestBody NameRequest request) {
        Section section = sectionRepo.findById(sectionId).orElseThrow();
        if (section.getCluster() == null || !section.getCluster().getId().equals(clusterId)) {
            throw new IllegalArgumentException("Section does not belong to this cluster");
        }
        String name = required(request.name(), "Section name");
        if (!section.getName().equalsIgnoreCase(name) && sectionRepo.existsByCluster_IdAndName(clusterId, name)) {
            throw new IllegalArgumentException("Section already exists: " + name);
        }
        section.setName(name);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", section.getId(), "name", section.getName())));
    }

    @DeleteMapping("/clusters/{clusterId}/sections/{sectionId}")
    @Transactional
    public ResponseEntity<?> deleteSection(@PathVariable Long clusterId, @PathVariable Long sectionId) {
        Section section = sectionRepo.findById(sectionId).orElseThrow();
        if (section.getCluster() == null || !section.getCluster().getId().equals(clusterId)) {
            throw new IllegalArgumentException("Section does not belong to this cluster");
        }
        if (teamRepo.countBySectionId(sectionId) > 0) {
            throw new IllegalStateException("This section has teams and cannot be deleted");
        }
        sectionRepo.delete(section);
        return ResponseEntity.ok(ApiResponse.success("Section deleted"));
    }

    @PostMapping("/clusters/{clusterId}/cluster-head")
    @Transactional
    public ResponseEntity<?> createClusterHead(@PathVariable Long clusterId, @RequestBody AccountRequest request) {
        Cluster cluster = clusterRepo.findById(clusterId).orElseThrow();
        if (cluster.getClusterHead() != null) {
            throw new IllegalStateException("This cluster already has a Cluster Head");
        }
        User user = createAccount(request, Role.RoleName.CLUSTER_HEAD);
        cluster.setClusterHead(user);
        clusterRepo.save(cluster);
        return ResponseEntity.ok(ApiResponse.success(userView(user)));
    }

    @PostMapping("/clusters/{clusterId}/guides")
    @Transactional
    public ResponseEntity<?> createGuide(@PathVariable Long clusterId, @RequestBody AccountRequest request) {
        Cluster cluster = clusterRepo.findById(clusterId).orElseThrow();
        User user = createAccount(request, Role.RoleName.MENTOR);
        cluster.getGuides().add(user);
        clusterRepo.save(cluster);
        return ResponseEntity.ok(ApiResponse.success(userView(user)));
    }

    @PutMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> updateManagedUser(@PathVariable Long id, @RequestBody AccountRequest request) {
        User user = userRepo.findById(id).orElseThrow();
        userRepo.findByEmail(required(request.email(), "Email")).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Email already registered: " + request.email());
            }
        });
        user.setFirstName(required(request.firstName(), "First name"));
        user.setLastName(required(request.lastName(), "Last name"));
        user.setEmail(request.email().trim());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        return ResponseEntity.ok(ApiResponse.success(userView(userRepo.save(user))));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deactivateManagedUser(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow();
        user.setActive(false);
        clusterRepo.findAll().forEach(cluster -> {
            if (cluster.getClusterHead() != null && cluster.getClusterHead().getId().equals(id)) {
                cluster.setClusterHead(null);
            }
            cluster.getGuides().removeIf(guide -> guide.getId().equals(id));
        });
        userRepo.save(user);
        return ResponseEntity.ok(ApiResponse.success("Account deactivated and unassigned"));
    }

    private User createAccount(AccountRequest request, Role.RoleName roleName) {
        String email = required(request.email(), "Email");
        String password = required(request.password(), "Password");
        if (userRepo.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }
        Role role = roleRepo.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Role is not configured: " + roleName));
        return userRepo.save(User.builder()
                .firstName(required(request.firstName(), "First name"))
                .lastName(required(request.lastName(), "Last name"))
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .active(true)
                .build());
    }

    private Map<String, Object> clusterView(Cluster cluster) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", cluster.getId());
        view.put("name", cluster.getName());
        view.put("clusterHead", cluster.getClusterHead() == null ? null : userView(cluster.getClusterHead()));
        view.put("guides", cluster.getGuides().stream().map(this::userView).toList());
        view.put("sections", cluster.getSections().stream()
                .map(section -> Map.of("id", section.getId(), "name", section.getName()))
                .toList());
        return view;
    }

    private Map<String, Object> userView(User user) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", user.getId());
        view.put("firstName", user.getFirstName());
        view.put("lastName", user.getLastName());
        view.put("email", user.getEmail());
        view.put("roleName", user.getRole().getName().name());
        view.put("active", user.getActive());
        return view;
    }

    private String required(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
        return value.trim();
    }

    public record NameRequest(String name) {}
    public record ClusterRequest(String name) {}
    public record AccountRequest(String firstName, String lastName, String email, String password) {}
}
