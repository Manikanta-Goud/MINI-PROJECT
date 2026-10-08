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
@RequestMapping("/api/mentor")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('MENTOR')")
public class MentorController {

    private final UserRepository userRepo;
    private final SectionRepository sectionRepo;
    private final TeamRepository teamRepo;

    @GetMapping("/my-sections")
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
            mentorMap.put("name", mentor.getFirstName() + " " + mentor.getLastName());
            mentorMap.put("email", mentor.getEmail());
            m.put("mentor", mentorMap);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}