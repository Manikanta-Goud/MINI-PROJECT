package com.projectevaluation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "paper_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaperSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String filePath;

    @Column
    private Integer versionNumber;

    @Column
    private Double aiContentPercent;

    @Column
    private Double plagiarismPercent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @CreationTimestamp
    private LocalDateTime submittedAt;

    private LocalDateTime evaluatedAt;

    public enum SubmissionStatus {
        PENDING, UNDER_REVIEW, PASSED, FAILED
    }
}
