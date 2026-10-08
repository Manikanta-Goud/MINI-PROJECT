package com.projectevaluation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "version_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VersionSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer versionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "version_session_papers",
        joinColumns = @JoinColumn(name = "version_session_id"),
        inverseJoinColumns = @JoinColumn(name = "paper_id"))
    @Builder.Default
    private List<PaperSubmission> papers = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SessionStatus status = SessionStatus.OPEN;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    public enum SessionStatus { OPEN, COMPLETED }
}
