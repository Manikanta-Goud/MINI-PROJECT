package com.projectevaluation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(name = "reviewer_role")
    @Enumerated(EnumType.STRING)
    private ReviewerRole reviewerRole;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "technical_score")
    private Integer technicalScore;

    @Column(name = "documentation_score")
    private Integer documentationScore;

    @Column(name = "innovation_score")
    private Integer innovationScore;

    @Column(name = "presentation_score")
    private Integer presentationScore;

    @Column(name = "overall_score")
    private Double overallScore;

    @Enumerated(EnumType.STRING)
    private Recommendation recommendation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ReviewerRole {
        MENTOR, CLUSTER_HEAD
    }

    public enum Recommendation {
        APPROVE, REQUEST_CHANGES, REJECT
    }
}
