package com.projectevaluation.controller;

import com.projectevaluation.entity.*;
import com.projectevaluation.exception.ApiResponse;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SectionController {

    private final SectionRepository sectionRepo;
    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final PaperSubmissionRepository paperRepo;
    private final VersionSessionRepository versionRepo;
    private final FinalResultRepository finalResultRepo;

    // -- Sections ----------------------------------------------------------

    @GetMapping
    public ResponseEntity<?> getAllSections() {
        List<Map<String, Object>> list = sectionRepo.findAll().stream().map(this::sectionMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSection(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (sectionRepo.existsByName(name)) return ResponseEntity.badRequest().body(ApiResponse.error("Section already exists", "ERROR"));
        Section s = Section.builder().name(name).build();
        if (body.get("mentorId") != null) {
            Long mid = Long.parseLong(body.get("mentorId").toString());
            userRepo.findById(mid).ifPresent(s::setMentor);
        }
        return ResponseEntity.ok(ApiResponse.success(sectionMap(sectionRepo.save(s))));
    }

    @PutMapping("/{id}/assign-mentor")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignMentor(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Section s = sectionRepo.findById(id).orElseThrow();
        Long mid = Long.parseLong(body.get("mentorId").toString());
        User mentor = userRepo.findById(mid).orElseThrow();
        s.setMentor(mentor);
        return ResponseEntity.ok(ApiResponse.success(sectionMap(sectionRepo.save(s))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        sectionRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    // -- Teams -------------------------------------------------------------

    @GetMapping("/{id}/teams")
    public ResponseEntity<?> getTeams(@PathVariable Long id) {
        List<Map<String, Object>> teams = teamRepo.findBySectionId(id).stream().map(this::teamMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(teams));
    }

    @PostMapping("/{id}/teams")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MENTOR')")
    public ResponseEntity<?> createTeam(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Section section = sectionRepo.findById(id).orElseThrow();
        Team team = Team.builder().name((String) body.get("name")).section(section).build();
        return ResponseEntity.ok(ApiResponse.success(teamMap(teamRepo.save(team))));
    }

    @PutMapping("/teams/{teamId}/assign-cluster-head")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MENTOR')")
    public ResponseEntity<?> assignClusterHead(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        Long chId = Long.parseLong(body.get("clusterHeadId").toString());
        User ch = userRepo.findById(chId).orElseThrow();
        if (!team.getClusterHeads().contains(ch)) team.getClusterHeads().add(ch);
        return ResponseEntity.ok(ApiResponse.success(teamMap(teamRepo.save(team))));
    }

    @PutMapping("/teams/{teamId}/add-member")
    public ResponseEntity<?> addMember(@PathVariable Long teamId, @RequestBody Map<String, Object> body) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        Long sid = Long.parseLong(body.get("studentId").toString());
        User student = userRepo.findById(sid).orElseThrow();
        if (!team.getMembers().contains(student)) team.getMembers().add(student);
        return ResponseEntity.ok(ApiResponse.success(teamMap(teamRepo.save(team))));
    }

    @GetMapping("/teams/{teamId}")
    public ResponseEntity<?> getTeam(@PathVariable Long teamId) {
        Team team = teamRepo.findById(teamId).orElseThrow();
        return ResponseEntity.ok(ApiResponse.success(teamMap(team)));
    }

    // -- Paper Submissions -------------------------------------------------

    @GetMapping("/{id}/papers")
    public ResponseEntity<?> getPapers(@PathVariable Long id) {
        List<Map<String, Object>> papers = paperRepo.findBySectionId(id).stream().map(this::paperMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(papers));
    }

    // -- Versions ----------------------------------------------------------

    @GetMapping("/{id}/versions")
    public ResponseEntity<?> getVersions(@PathVariable Long id) {
        List<Map<String, Object>> versions = versionRepo.findBySectionIdOrderByVersionNumberAsc(id).stream().map(vs -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", vs.getId());
            m.put("versionNumber", vs.getVersionNumber());
            m.put("status", vs.getStatus());
            m.put("createdAt", vs.getCreatedAt());
            m.put("completedAt", vs.getCompletedAt());
            m.put("papers", vs.getPapers().stream().map(this::paperMap).collect(Collectors.toList()));
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(versions));
    }

    @PostMapping("/{id}/versions/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MENTOR') or hasRole('CLUSTER_HEAD')")
    public ResponseEntity<?> createVersion(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        Section section = sectionRepo.findById(id).orElseThrow();
        Optional<VersionSession> existing = versionRepo.findBySectionIdAndStatus(id, VersionSession.SessionStatus.OPEN);
        if (existing.isPresent()) return ResponseEntity.badRequest().body(ApiResponse.error("Version already open for this section", "ERROR"));
        Optional<VersionSession> last = versionRepo.findTopBySectionIdOrderByVersionNumberDesc(id);
        int nextVersion = last.map(vs -> vs.getVersionNumber() + 1).orElse(1);
        User creator = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        // Add all PENDING or FAILED papers for this section to this version
        List<PaperSubmission> pendingPapers = paperRepo.findBySectionId(id).stream()
                .filter(p -> p.getStatus() == PaperSubmission.SubmissionStatus.PENDING || p.getStatus() == PaperSubmission.SubmissionStatus.FAILED)
                .collect(Collectors.toList());
        VersionSession vs = VersionSession.builder()
                .versionNumber(nextVersion)
                .section(section)
                .createdBy(creator)
                .papers(pendingPapers)
                .build();
        versionRepo.save(vs); return ResponseEntity.ok(ApiResponse.success("Version created"));
    }

    @PostMapping("/versions/{vsId}/evaluate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MENTOR') or hasRole('CLUSTER_HEAD')")
    public ResponseEntity<?> evaluatePapers(@PathVariable Long vsId, @RequestBody Map<String, Object> body) {
        VersionSession vs = versionRepo.findById(vsId).orElseThrow();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> evaluations = (List<Map<String, Object>>) body.get("evaluations");
        List<FinalResult> newResults = new ArrayList<>();
        for (Map<String, Object> eval : evaluations) {
            Long paperId = Long.parseLong(eval.get("paperId").toString());
            double aiPct = Double.parseDouble(eval.get("aiContentPercent").toString());
            double plagPct = Double.parseDouble(eval.get("plagiarismPercent").toString());
            PaperSubmission paper = paperRepo.findById(paperId).orElseThrow();
            paper.setAiContentPercent(aiPct);
            paper.setPlagiarismPercent(plagPct);
            paper.setEvaluatedAt(java.time.LocalDateTime.now());
            paper.setVersionNumber(vs.getVersionNumber());
            if (aiPct == 0.0 && plagPct <= 10.0) {
                paper.setStatus(PaperSubmission.SubmissionStatus.PASSED);
                if (!finalResultRepo.existsByTeamId(paper.getTeam().getId())) {
                    FinalResult fr = FinalResult.builder()
                            .team(paper.getTeam())
                            .paper(paper)
                            .section(vs.getSection())
                            .versionPassed(vs.getVersionNumber())
                            .aiContentPercent(aiPct)
                            .plagiarismPercent(plagPct)
                            .build();
                    newResults.add(fr);
                }
            } else {
                paper.setStatus(PaperSubmission.SubmissionStatus.FAILED);
            }
            paperRepo.save(paper);
        }
        finalResultRepo.saveAll(newResults);
        vs.setStatus(VersionSession.SessionStatus.COMPLETED);
        vs.setCompletedAt(java.time.LocalDateTime.now());
        versionRepo.save(vs);
        return ResponseEntity.ok(ApiResponse.success("Evaluation complete. Failed papers will appear in next version."));
    }

    // -- Final Results -----------------------------------------------------

    @GetMapping("/final-results")
    public ResponseEntity<?> getAllFinalResults() {
        List<Map<String, Object>> results = finalResultRepo.findAll().stream().map(fr -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", fr.getId());
            m.put("teamName", fr.getTeam().getName());
            m.put("sectionName", fr.getSection().getName());
            m.put("paperName", fr.getPaper().getFileName());
            m.put("versionPassed", fr.getVersionPassed());
            m.put("aiContentPercent", fr.getAiContentPercent());
            m.put("plagiarismPercent", fr.getPlagiarismPercent());
            m.put("passedAt", fr.getPassedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @GetMapping("/final-results/section/{sectionId}")
    public ResponseEntity<?> getFinalResultsBySection(@PathVariable Long sectionId) {
        List<Map<String, Object>> results = finalResultRepo.findBySectionId(sectionId).stream().map(fr -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", fr.getId());
            m.put("teamName", fr.getTeam().getName());
            m.put("sectionName", fr.getSection().getName());
            m.put("paperName", fr.getPaper().getFileName());
            m.put("versionPassed", fr.getVersionPassed());
            m.put("aiContentPercent", fr.getAiContentPercent());
            m.put("plagiarismPercent", fr.getPlagiarismPercent());
            m.put("passedAt", fr.getPassedAt());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // -- Paper Upload ------------------------------------------------------

    @PostMapping("/papers/upload")
    public ResponseEntity<?> uploadPaper(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("teamId") Long teamId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            User student = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
            Team team = teamRepo.findById(teamId).orElseThrow();
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads/papers");
            java.nio.file.Files.createDirectories(uploadDir);
            String fileName = java.util.UUID.randomUUID() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadDir.resolve(fileName);
            file.transferTo(filePath.toFile());
            PaperSubmission paper = PaperSubmission.builder()
                    .student(student)
                    .team(team)
                    .fileName(file.getOriginalFilename())
                    .filePath(filePath.toString())
                    .status(PaperSubmission.SubmissionStatus.PENDING)
                    .build();
            paperRepo.save(paper);
            return ResponseEntity.ok(ApiResponse.success(paperMap(paper)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage(), "UPLOAD_ERROR"));
        }
    }

    @GetMapping("/papers/my")
    public ResponseEntity<?> getMyPapers(
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        User student = userRepo.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Map<String, Object>> papers = paperRepo.findByStudent(student).stream().map(this::paperMap).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(papers));
    }

    // -- Helpers -----------------------------------------------------------

    private Map<String, Object> sectionMap(Section s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("name", s.getName());
        if (s.getMentor() != null) {
            Map<String, Object> mentor = new LinkedHashMap<>();
            mentor.put("id", s.getMentor().getId());
            mentor.put("name", s.getMentor().getFirstName() + " " + s.getMentor().getLastName());
            mentor.put("email", s.getMentor().getEmail());
            m.put("mentor", mentor);
        } else {
            m.put("mentor", null);
        }
        m.put("teamCount", s.getTeams().size());
        return m;
    }

    private Map<String, Object> teamMap(Team t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());
        m.put("name", t.getName());
        m.put("sectionId", t.getSection().getId());
        m.put("sectionName", t.getSection().getName());
        m.put("clusterHeads", t.getClusterHeads().stream().map(u -> {
            Map<String, Object> um = new LinkedHashMap<>();
            um.put("id", u.getId());
            um.put("name", u.getFirstName() + " " + u.getLastName());
            um.put("email", u.getEmail());
            return um;
        }).collect(Collectors.toList()));
        m.put("members", t.getMembers().stream().map(u -> {
            Map<String, Object> um = new LinkedHashMap<>();
            um.put("id", u.getId());
            um.put("name", u.getFirstName() + " " + u.getLastName());
            um.put("email", u.getEmail());
            return um;
        }).collect(Collectors.toList()));
        m.put("memberCount", t.getMembers().size());
        return m;
    }

    private Map<String, Object> paperMap(PaperSubmission p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("fileName", p.getFileName());
        m.put("status", p.getStatus());
        m.put("versionNumber", p.getVersionNumber());
        m.put("aiContentPercent", p.getAiContentPercent());
        m.put("plagiarismPercent", p.getPlagiarismPercent());
        m.put("submittedAt", p.getSubmittedAt());
        m.put("evaluatedAt", p.getEvaluatedAt());
        if (p.getTeam() != null) {
            m.put("teamId", p.getTeam().getId());
            m.put("teamName", p.getTeam().getName());
            m.put("sectionName", p.getTeam().getSection().getName());
        }
        if (p.getStudent() != null) {
            m.put("studentName", p.getStudent().getFirstName() + " " + p.getStudent().getLastName());
        }
        return m;
    }
}




