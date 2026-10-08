package com.projectevaluation.controller;

import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
}