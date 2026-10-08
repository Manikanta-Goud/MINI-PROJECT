package com.projectevaluation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "final_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinalResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id")
    private PaperSubmission paper;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(nullable = false)
    private Integer versionPassed;

    @Column
    private Double aiContentPercent;

    @Column
    private Double plagiarismPercent;

    @CreationTimestamp
    private LocalDateTime passedAt;
}
