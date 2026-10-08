package com.projectevaluation.repository;
import com.projectevaluation.entity.PaperSubmission;
import com.projectevaluation.entity.Team;
import com.projectevaluation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface PaperSubmissionRepository extends JpaRepository<PaperSubmission, Long> {
    List<PaperSubmission> findByStudent(User student);
    List<PaperSubmission> findByTeam(Team team);
    List<PaperSubmission> findByTeamAndVersionNumber(Team team, Integer versionNumber);
    List<PaperSubmission> findByVersionNumber(Integer versionNumber);
    List<PaperSubmission> findByStatus(PaperSubmission.SubmissionStatus status);
    @Query("SELECT p FROM PaperSubmission p WHERE p.team.section.id = :sectionId")
    List<PaperSubmission> findBySectionId(@Param("sectionId") Long sectionId);
    @Query("SELECT p FROM PaperSubmission p WHERE p.team.section.id = :sectionId AND p.versionNumber = :version")
    List<PaperSubmission> findBySectionIdAndVersion(@Param("sectionId") Long sectionId, @Param("version") Integer version);
}
