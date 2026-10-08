package com.projectevaluation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @Column(name = "technical_score")
    private Integer technicalScore;

    @Column(name = "innovation_score")
    private Integer innovationScore;

    @Column(name = "implementation_score")
    private Integer implementationScore;

    @Column(name = "documentation_score")
    private Integer documentationScore;

    @Column(name = "presentation_score")
    private Integer presentationScore;

    @Column(name = "viva_score")
    private Integer vivaScore;

    @Column(name = "total_score")
    private Double totalScore;

    private String grade;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "evaluated_at")
    @CreationTimestamp
    private LocalDateTime evaluatedAt;

    /**
     * Calculate total score and grade based on individual criteria.
     * Each criterion is out of 20, total is out of 120, converted to percentage.
     */
    @PrePersist
    @PreUpdate
    public void calculateTotals() {
        if (technicalScore != null && innovationScore != null &&
            implementationScore != null && documentationScore != null &&
            presentationScore != null && vivaScore != null) {
            double total = technicalScore + innovationScore + implementationScore
                           + documentationScore + presentationScore + vivaScore;
            totalScore = (total / 120.0) * 100.0;
            grade = calculateGrade(totalScore);
        }
    }

    private String calculateGrade(double score) {
        if (score >= 90) return "A+";
        else if (score >= 80) return "A";
        else if (score >= 70) return "B";
        else if (score >= 60) return "C";
        else if (score >= 50) return "D";
        else return "F";
    }
}
