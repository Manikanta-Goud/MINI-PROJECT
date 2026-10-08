package com.projectevaluation.repository;
import com.projectevaluation.entity.FinalResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FinalResultRepository extends JpaRepository<FinalResult, Long> {
    List<FinalResult> findBySectionId(Long sectionId);
    List<FinalResult> findByTeamId(Long teamId);
    boolean existsByTeamId(Long teamId);
}
