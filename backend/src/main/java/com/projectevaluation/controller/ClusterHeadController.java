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

    @GetMapping("/my-cluster")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getMyCluster(@AuthenticationPrincipal UserDetails userDetails) {
        User clusterHead = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        Optional<Cluster> assignedCluster = clusterRepo.findByClusterHead_Id(clusterHead.getId());
        if (assignedCluster.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(clusterView(assignedCluster.get())));
        }

        List<Team> assignedTeams = teamRepo.findAll().stream()
                .filter(team -> team.getClusterHeads().stream()
                        .anyMatch(head -> head.getId().equals(clusterHead.getId())))
                .collect(Collectors.toList());
        Map<Long, Section> assignedSections = assignedTeams.stream()
                .map(Team::getSection)
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(Section::getId, section -> section, (first, ignored) -> first,
                        LinkedHashMap::new));
        if (!assignedSections.isEmpty()) {
            Map<String, Object> derivedDetails = new LinkedHashMap<>();
            derivedDetails.put("id", null);
            derivedDetails.put("name", null);
            derivedDetails.put("clusterHead", userView(clusterHead));
            derivedDetails.put("guides", assignedSections.values().stream()
                    .map(Section::getMentor)
                    .filter(Objects::nonNull)
                    .distinct()
                    .map(this::userView)
                    .collect(Collectors.toList()));
            derivedDetails.put("sections", assignedSections.values().stream().map(section -> {
                Map<String, Object> sectionView = new LinkedHashMap<>();
                sectionView.put("id", section.getId());
                sectionView.put("name", section.getName());
                sectionView.put("teamCount", assignedTeams.stream()
                        .filter(team -> team.getSection().getId().equals(section.getId()))
                        .count());
                return sectionView;
            }).collect(Collectors.toList()));
            return ResponseEntity.ok(ApiResponse.success(derivedDetails));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private Map<String, Object> clusterView(Cluster cluster) {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("id", cluster.getId());
                    result.put("name", cluster.getName());
                    result.put("clusterHead", userView(cluster.getClusterHead()));
                    result.put("guides", cluster.getGuides().stream().map(this::userView).collect(Collectors.toList()));
                    result.put("sections", cluster.getSections().stream().map(section -> {
                        Map<String, Object> sectionView = new LinkedHashMap<>();
                        sectionView.put("id", section.getId());
                        sectionView.put("name", section.getName());
                        sectionView.put("teamCount", section.getTeams().size());
                        return sectionView;
                    }).collect(Collectors.toList()));
                    return result;
    }

    @GetMapping("/my-teams")
    public ResponseEntity<?> getMyTeams(@AuthenticationPrincipal UserDetails userDetails) {
        User clusterHead = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Team> allTeams = teamRepo.findAll();
        List<Team> myTeams = allTeams.stream()
                .filter(t -> t.getClusterHeads().stream().anyMatch(ch -> ch.getId().equals(clusterHead.getId())))
                .collect(Collectors.toList());

        List<Map<String, Object>> result = myTeams.stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("name", t.getName());
            m.put("sectionId", t.getSection().getId());
            m.put("sectionName", t.getSection().getName());
            m.put("memberCount", t.getMembers().size());
            
            List<Map<String, Object>> members = t.getMembers().stream().map(mem -> {
                Map<String, Object> memMap = new LinkedHashMap<>();
                memMap.put("id", mem.getId());
                memMap.put("name", mem.getFirstName() + " " + mem.getLastName());
                memMap.put("email", mem.getEmail());
                return memMap;
            }).collect(Collectors.toList());
            m.put("members", members);

            List<Map<String, Object>> clusterHeads = t.getClusterHeads().stream().map(ch -> {
                Map<String, Object> chMap = new LinkedHashMap<>();
                chMap.put("id", ch.getId());
                chMap.put("name", ch.getFirstName() + " " + ch.getLastName());
                chMap.put("email", ch.getEmail());
                return chMap;
            }).collect(Collectors.toList());
            m.put("clusterHeads", clusterHeads);

            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private Map<String, Object> userView(User user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getFullName());
        result.put("email", user.getEmail());
        return result;
    }
}