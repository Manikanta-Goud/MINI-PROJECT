package com.projectevaluation.repository;
import com.projectevaluation.entity.VersionSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface VersionSessionRepository extends JpaRepository<VersionSession, Long> {
    List<VersionSession> findBySectionIdOrderByVersionNumberAsc(Long sectionId);
    Optional<VersionSession> findBySectionIdAndStatus(Long sectionId, VersionSession.SessionStatus status);
    Optional<VersionSession> findTopBySectionIdOrderByVersionNumberDesc(Long sectionId);
}
