package com.projectevaluation.controller;

import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('MENTOR')")
public class MentorController {

    private final UserRepository userRepo;
    private final SectionRepository sectionRepo;
    private final TeamRepository teamRepo;
    private final RoleRepository roleRepo;
    private final ClusterRepository clusterRepo;
    private final PasswordEncoder passwordEncoder;

    // ── GET /my-cluster-heads ────────────────────────────────────────────────
    @GetMapping("/my-cluster-heads")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyClusterHeads(@AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Team> myTeams = teamRepo.findByClusterHead(mentor);

        // Collect clusters via teams this mentor is assigned to
        Set<Long> clusterIds = new LinkedHashSet<>();
        for (Team t : myTeams) {
            try {
                if (t.getSection() != null && t.getSection().getCluster() != null) {
                    clusterIds.add(t.getSection().getCluster().getId());
                }
            } catch (Exception ignored) {}
        }

        // Also find clusters where this mentor appears in the guides list
        try {
            for (Cluster c : clusterRepo.findAll()) {
                try {
                    if (c.getGuides() != null && c.getGuides().stream().anyMatch(g -> g.getId().equals(mentor.getId()))) {
                        clusterIds.add(c.getId());
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        List<Map<String, Object>> result = new ArrayList<>();
        for (Long cid : clusterIds) {
            Cluster c = clusterRepo.findById(cid).orElse(null);
            if (c == null) continue;
            Map<String, Object> cm = new LinkedHashMap<>();
            cm.put("clusterId", c.getId());
            cm.put("clusterName", c.getName());
            try {
                User ch = c.getClusterHead();
                if (ch != null) {
                    cm.put("clusterHeadId", ch.getId());
                    cm.put("clusterHeadName", ch.getFullName());
                    cm.put("clusterHeadEmail", ch.getEmail());
                    cm.put("clusterHeadPhone", ch.getPhone());
                }
            } catch (Exception ignored) {}
            List<String> assignedTeamNames = myTeams.stream()
                    .filter(t -> {
                        try {
                            return t.getSection() != null
                                    && t.getSection().getCluster() != null
                                    && t.getSection().getCluster().getId().equals(cid);
                        } catch (Exception e) { return false; }
                    })
                    .map(Team::getName)
                    .collect(Collectors.toList());
            cm.put("assignedTeams", assignedTeamNames);
            result.add(cm);
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── GET /my-sections ──────────────────────────────────────────────────────
    @GetMapping("/my-sections")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMySections(@AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Section> sections = sectionRepo.findByMentor(mentor);
        List<Map<String, Object>> result = sections.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("teamCount", s.getTeams().size());
            Map<String, Object> mentorMap = new LinkedHashMap<>();
            mentorMap.put("id", mentor.getId());
            mentorMap.put("name", mentor.getFullName());
            mentorMap.put("email", mentor.getEmail());
            m.put("mentor", mentorMap);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── GET /my-teams  — all teams assigned to this mentor (via clusterHeads join) ─
    @GetMapping("/my-teams")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyTeams(@AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        // Teams where this mentor appears in the clusterHeads (assigned-mentor) list
        List<Team> teams = teamRepo.findByClusterHead(mentor);
        List<Map<String, Object>> result = teams.stream().map(t -> teamView(t, mentor)).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // ── GET /teams/{teamId}/members  — get team members ──────────────────────
    @GetMapping("/teams/{teamId}/members")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getTeamMembers(
            @PathVariable Long teamId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = findAndValidateTeam(teamId, mentor);
        List<Map<String, Object>> members = team.getMembers().stream().map(m -> {
            Map<String, Object> mm = new LinkedHashMap<>();
            mm.put("id", m.getId());
            mm.put("name", m.getFullName());
            mm.put("email", m.getEmail());
            mm.put("rollNumber", m.getRollNumber());
            // Team leader = STUDENT role with email != null
            boolean isLeader = team.getMembers().indexOf(m) == 0
                    && m.getRole() != null
                    && m.getRole().getName() == Role.RoleName.STUDENT;
            mm.put("isLeader", isLeader);
            return mm;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    // ── POST /teams/{teamId}/create-leader  — create login credentials for team leader ─
    @PostMapping("/teams/{teamId}/create-leader")
    @Transactional
    public ResponseEntity<?> createTeamLeader(
            @PathVariable Long teamId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = findAndValidateTeam(teamId, mentor);

        String firstName = required(body.get("firstName"), "First name");
        String lastName = required(body.get("lastName"), "Last name");
        String email = required(body.get("email"), "Email");
        String password = required(body.get("password"), "Password");
        String rollNumber = body.get("rollNumber");

        if (userRepo.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered: " + email);
        }

        Role studentRole = roleRepo.findByName(Role.RoleName.STUDENT)
                .orElseThrow(() -> new IllegalStateException("STUDENT role not found"));

        User leader = userRepo.save(User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(password))
                .rollNumber(rollNumber)
                .role(studentRole)
                .active(true)
                .build());

        // Add leader as first member of team
        if (!team.getMembers().contains(leader)) {
            team.getMembers().add(0, leader);
            teamRepo.save(team);
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", leader.getId());
        resp.put("name", leader.getFullName());
        resp.put("email", leader.getEmail());
        resp.put("rollNumber", leader.getRollNumber());
        resp.put("isLeader", true);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    // ── POST /teams/{teamId}/members  — add plain member (name only, no login) ─
    @PostMapping("/teams/{teamId}/members")
    @Transactional
    public ResponseEntity<?> addTeamMember(
            @PathVariable Long teamId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = findAndValidateTeam(teamId, mentor);

        String firstName = required(body.get("firstName"), "First name");
        String lastName = body.getOrDefault("lastName", "");
        String rollNumber = body.get("rollNumber");

        // Generate a placeholder email so unique constraint is satisfied
        String placeholderEmail = "member." + System.currentTimeMillis() + "@placeholder.internal";

        Role studentRole = roleRepo.findByName(Role.RoleName.STUDENT)
                .orElseThrow(() -> new IllegalStateException("STUDENT role not found"));

        User member = userRepo.save(User.builder()
                .firstName(firstName)
                .lastName(lastName.isBlank() ? "." : lastName)
                .email(placeholderEmail)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .rollNumber(rollNumber)
                .role(studentRole)
                .active(false) // not a real login account
                .build());

        team.getMembers().add(member);
        teamRepo.save(team);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", member.getId());
        resp.put("name", member.getFullName());
        resp.put("email", null); // don't expose placeholder
        resp.put("rollNumber", member.getRollNumber());
        resp.put("isLeader", false);
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    // ── DELETE /teams/{teamId}/members/{memberId}  — remove a member ─────────
    @DeleteMapping("/teams/{teamId}/members/{memberId}")
    @Transactional
    public ResponseEntity<?> removeTeamMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User mentor = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Team team = findAndValidateTeam(teamId, mentor);
        team.getMembers().removeIf(m -> m.getId().equals(memberId));
        teamRepo.save(team);
        return ResponseEntity.ok(ApiResponse.success("Member removed"));
    }

    // ── helpers ───────────────────────────────────────────────────────────────
    private Team findAndValidateTeam(Long teamId, User mentor) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        boolean assigned = team.getClusterHeads().stream().anyMatch(ch -> ch.getId().equals(mentor.getId()));
        if (!assigned) throw new SecurityException("This team is not assigned to you");
        return team;
    }

    private String required(String value, String fieldName) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(fieldName + " is required");
        return value.trim();
    }

    private Map<String, Object> teamView(Team t, User mentor) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("sectionId", t.getSection() != null ? t.getSection().getId() : null);
        m.put("sectionName", t.getSection() != null ? t.getSection().getName() : null);
        m.put("memberCount", t.getMembers().size());
        m.put("members", t.getMembers().stream().map(mem -> {
            Map<String, Object> mm = new LinkedHashMap<>();
            mm.put("id", mem.getId());
            mm.put("name", mem.getFullName());
            mm.put("email", Boolean.TRUE.equals(mem.getActive()) ? mem.getEmail() : null);
            mm.put("rollNumber", mem.getRollNumber());
            mm.put("isLeader", Boolean.TRUE.equals(mem.getActive())); // active = has real login = leader
            return mm;
        }).collect(Collectors.toList()));
        return m;
    }
}