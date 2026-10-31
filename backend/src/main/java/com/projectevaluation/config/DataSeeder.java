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

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final PasswordEncoder encoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Ensure all roles exist
        for (Role.RoleName roleName : Role.RoleName.values()) {
            if (roleRepo.findByName(roleName).isEmpty()) {
                roleRepo.save(Role.builder().name(roleName).build());
            }
        }

        // Super Admin account only — no mock data
        if (userRepo.findByEmail("admin@college.edu").isEmpty()) {
            Role adminRole = roleRepo.findByName(Role.RoleName.ADMIN).orElseThrow();
            userRepo.save(User.builder()
                .firstName("Super")
                .lastName("Admin")
                .email("admin@college.edu")
                .password(encoder.encode("Admin@1234"))
                .role(adminRole)
                .active(true)
                .build());
            log.info("Seeded: Super Admin account created. Login: admin@college.edu / Admin@1234");
        } else {
            log.info("Admin account already exists in database.");
        }
    }
}
