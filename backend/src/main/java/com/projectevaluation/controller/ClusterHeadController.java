package com.projectevaluation.controller;

import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cluster-head")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CLUSTER_HEAD')")
public class ClusterHeadController {

    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final ClusterRepository clusterRepo;
    private final SectionRepository sectionRepo;
    private final RoleRepository roleRepo;

    // ─────────────────────────────────────────────────────────────────────────
    // GET /my-cluster  — cluster info + sections + guides
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/my-cluster")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyCluster(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Optional<Cluster> assignedCluster = clusterRepo.findByClusterHead_Id(me.getId());
        if (assignedCluster.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(clusterView(assignedCluster.get())));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /my-sections  — sections assigned to this cluster head's cluster
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/my-sections")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMySections(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Optional<Cluster> clusterOpt = clusterRepo.findByClusterHead_Id(me.getId());
        if (clusterOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        Cluster cluster = clusterOpt.get();
        List<Map<String, Object>> sections = cluster.getSections().stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("teamCount", s.getTeams().size());
            m.put("mentorId", s.getMentor() != null ? s.getMentor().getId() : null);
            m.put("mentorName", s.getMentor() != null ? s.getMentor().getFullName() : null);
            m.put("mentorEmail", s.getMentor() != null ? s.getMentor().getEmail() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(sections));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /my-mentors  — mentors (guides) assigned to this cluster
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/my-mentors")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyMentors(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Optional<Cluster> clusterOpt = clusterRepo.findByClusterHead_Id(me.getId());
        if (clusterOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        Cluster cluster = clusterOpt.get();
        // Get all mentors from guides list of the cluster
        List<Map<String, Object>> mentors = cluster.getGuides().stream().map(g -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", g.getId());
            m.put("name", g.getFullName());
            m.put("email", g.getEmail());
            m.put("phone", g.getPhone());
            m.put("department", g.getDepartment());
            // Find which sections this mentor is assigned to (within this cluster)
            List<String> assignedSections = cluster.getSections().stream()
                    .filter(s -> s.getMentor() != null && s.getMentor().getId().equals(g.getId()))
                    .map(Section::getName)
                    .collect(Collectors.toList());
            m.put("assignedSections", assignedSections);
            // Find teams assigned to this mentor across sections
            long teamCount = cluster.getSections().stream()
                    .flatMap(s -> s.getTeams().stream())
                    .filter(t -> t.getClusterHeads().stream().anyMatch(ch -> ch.getId().equals(me.getId())))
                    .count();
            m.put("teamCount", teamCount);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(mentors));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /sections/{sectionId}/teams  — teams in a section
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/sections/{sectionId}/teams")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSectionTeams(
            @PathVariable Long sectionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        // Verify this section belongs to cluster head's cluster
        validateSectionOwnership(me, section);

        List<Map<String, Object>> teams = section.getTeams().stream().map(t -> teamView(t)).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /sections/{sectionId}/teams  — create a team in a section
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/sections/{sectionId}/teams")
    @Transactional
    public ResponseEntity<?> createTeam(
            @PathVariable Long sectionId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        validateSectionOwnership(me, section);

        String name = body.getOrDefault("name", "").trim();
        if (name.isEmpty()) throw new IllegalArgumentException("Team name is required");

        // Check duplicate team name within section
        boolean exists = section.getTeams().stream().anyMatch(t -> t.getName().equalsIgnoreCase(name));
        if (exists) throw new IllegalArgumentException("Team '" + name + "' already exists in this section");

        Team team = Team.builder()
                .name(name)
                .section(section)
                .build();
        team = teamRepo.save(team);
        return ResponseEntity.ok(ApiResponse.success(teamView(team)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /teams/{teamId}  — delete a team
    // ─────────────────────────────────────────────────────────────────────────
    @DeleteMapping("/teams/{teamId}")
    @Transactional
    public ResponseEntity<?> deleteTeam(
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        validateSectionOwnership(me, team.getSection());
        teamRepo.delete(team);
        return ResponseEntity.ok(ApiResponse.success("Team deleted"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /teams/{teamId}/assign-mentor  — assign a mentor to a team
    // ─────────────────────────────────────────────────────────────────────────
    @PutMapping("/teams/{teamId}/assign-mentor")
    @Transactional
    public ResponseEntity<?> assignMentorToTeam(
            @PathVariable Long teamId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        validateSectionOwnership(me, team.getSection());

        Long mentorId = body.get("mentorId") != null ? Long.parseLong(body.get("mentorId").toString()) : null;
        if (mentorId == null) {
            // Unassign: remove cluster head from team's clusterHeads list
            team.getClusterHeads().clear();
            teamRepo.save(team);
            return ResponseEntity.ok(ApiResponse.success("Mentor unassigned from team"));
        }
        User mentor = userRepo.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Mentor not found"));
        // Store mentor as "cluster head" of team (existing schema uses this field for assigned guide)
        if (!team.getClusterHeads().contains(mentor)) {
            team.getClusterHeads().clear(); // one mentor per team
            team.getClusterHeads().add(mentor);
        }
        teamRepo.save(team);
        return ResponseEntity.ok(ApiResponse.success(teamView(team)));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /my-teams  — all teams in cluster head's cluster
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/my-teams")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyTeams(@AuthenticationPrincipal UserDetails userDetails) {
        User me = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Optional<Cluster> clusterOpt = clusterRepo.findByClusterHead_Id(me.getId());
        if (clusterOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        Cluster cluster = clusterOpt.get();
        List<Map<String, Object>> teams = cluster.getSections().stream()
                .flatMap(s -> s.getTeams().stream())
                .map(this::teamView)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private void validateSectionOwnership(User me, Section section) {
        Optional<Cluster> clusterOpt = clusterRepo.findByClusterHead_Id(me.getId());
        if (clusterOpt.isEmpty() || !section.getCluster().getId().equals(clusterOpt.get().getId())) {
            throw new IllegalArgumentException("You do not have access to this section");
        }
    }

    private Map<String, Object> teamView(Team t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("sectionId", t.getSection() != null ? t.getSection().getId() : null);
        m.put("sectionName", t.getSection() != null ? t.getSection().getName() : null);
        m.put("memberCount", t.getMembers().size());
        // The "assigned mentor" is stored in clusterHeads field
        List<Map<String, Object>> assigned = t.getClusterHeads().stream().map(u -> {
            Map<String, Object> um = new LinkedHashMap<>();
            um.put("id", u.getId());
            um.put("name", u.getFullName());
            um.put("email", u.getEmail());
            return um;
        }).collect(Collectors.toList());
        m.put("assignedMentors", assigned);
        m.put("members", t.getMembers().stream().map(mem -> {
            Map<String, Object> mm = new LinkedHashMap<>();
            mm.put("id", mem.getId());
            mm.put("name", mem.getFullName());
            mm.put("email", mem.getEmail());
            return mm;
        }).collect(Collectors.toList()));
        return m;
    }

    private Map<String, Object> clusterView(Cluster cluster) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", cluster.getId());
        result.put("name", cluster.getName());
        result.put("clusterHead", cluster.getClusterHead() != null ? userView(cluster.getClusterHead()) : null);
        result.put("guides", cluster.getGuides().stream().map(this::userView).collect(Collectors.toList()));
        result.put("sections", cluster.getSections().stream().map(section -> {
            Map<String, Object> sv = new LinkedHashMap<>();
            sv.put("id", section.getId());
            sv.put("name", section.getName());
            sv.put("teamCount", section.getTeams().size());
            sv.put("mentorId", section.getMentor() != null ? section.getMentor().getId() : null);
            sv.put("mentorName", section.getMentor() != null ? section.getMentor().getFullName() : null);
            return sv;
        }).collect(Collectors.toList()));
        return result;
    }

    private Map<String, Object> userView(User user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getFullName());
        result.put("email", user.getEmail());
        return result;
    }
}