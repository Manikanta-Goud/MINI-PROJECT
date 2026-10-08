package com.projectevaluation.config;

import com.projectevaluation.entity.*;
import com.projectevaluation.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final SectionRepository sectionRepo;
    private final TeamRepository teamRepo;
    private final PaperSubmissionRepository paperRepo;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepo.count() > 0) { log.info("Data already seeded."); return; }

        Role adminRole   = roleRepo.save(Role.builder().name(Role.RoleName.ADMIN).build());
        Role mentorRole  = roleRepo.save(Role.builder().name(Role.RoleName.MENTOR).build());
        Role clusterRole = roleRepo.save(Role.builder().name(Role.RoleName.CLUSTER_HEAD).build());
        Role studentRole = roleRepo.save(Role.builder().name(Role.RoleName.STUDENT).build());

        // Super Admin
        userRepo.save(User.builder().firstName("Super").lastName("Admin")
            .email("admin@college.edu").password(encoder.encode("Admin@1234")).role(adminRole).active(true).build());

        // 10 Mentors
        List<User> mentors = new ArrayList<>();
        for (int i = 1; i <= 10; i++) {
            mentors.add(userRepo.save(User.builder().firstName("Mentor").lastName(String.valueOf(i))
                .email("mentor" + i + "@college.edu").password(encoder.encode("Mentor@1234")).role(mentorRole).active(true).build()));
        }

        // 40 Cluster Heads
        List<User> clusters = new ArrayList<>();
        for (int i = 1; i <= 40; i++) {
            clusters.add(userRepo.save(User.builder().firstName("ClusterHead").lastName(String.valueOf(i))
                .email("ch" + i + "@college.edu").password(encoder.encode("Cluster@1234")).role(clusterRole).active(true).build()));
        }

        // 700 Students
        List<User> students = new ArrayList<>();
        for (int i = 1; i <= 700; i++) {
            students.add(userRepo.save(User.builder().firstName("Student").lastName(String.valueOf(i))
                .email("student" + i + "@college.edu").password(encoder.encode("Student@1234")).role(studentRole).active(true).build()));
        }

        // 20 Sections
        List<Section> sections = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            char secLetter = (char)('A' + i);
            String name = "Section " + secLetter;
            if (i > 25) name = "Section " + (i+1); // Just in case
            // Each mentor gets 2 sections
            User mentor = mentors.get(i / 2);
            sections.add(sectionRepo.save(Section.builder().name(name).mentor(mentor).build()));
        }

        // 7 Teams per section
        int stuIdx = 0;
        int chIdx = 0;
        int chTeamCount = 0;
        
        for (Section sec : sections) {
            for (int t = 1; t <= 7; t++) {
                Team team = Team.builder().name(sec.getName() + " - Team " + t).section(sec).build();
                
                // One cluster head manages 2 to 4 teams. Let's assign 1 cluster head per team, 
                // and reuse the same cluster head for 3 teams.
                if (chTeamCount >= 3) {
                    chIdx = (chIdx + 1) % clusters.size();
                    chTeamCount = 0;
                }
                team.getClusterHeads().add(clusters.get(chIdx));
                chTeamCount++;
                
                // 5 students per team
                for (int k = 0; k < 5 && stuIdx < students.size(); k++) {
                    team.getMembers().add(students.get(stuIdx++));
                }
                
                Team saved = teamRepo.save(team);

                // Paper submission from first student
                if (!saved.getMembers().isEmpty()) {
                    paperRepo.save(PaperSubmission.builder()
                        .student(saved.getMembers().get(0))
                        .team(saved)
                        .fileName("Research_Paper_" + saved.getName().replace(" ","_") + ".pdf")
                        .filePath("uploads/papers/mock_" + saved.getId() + ".pdf")
                        .status(PaperSubmission.SubmissionStatus.PENDING)
                        .build());
                }
            }
        }
        log.info("Seeded: 1 admin, {} mentors, {} cluster heads, {} students, {} sections, {} teams",
            mentors.size(), clusters.size(), students.size(), sections.size(), sections.size() * 7);
    }
}
