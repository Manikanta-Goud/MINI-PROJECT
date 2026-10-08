package com.projectevaluation.repository;

import com.projectevaluation.entity.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByProjectId(Long projectId);
    Optional<Evaluation> findByProjectIdAndEvaluatorId(Long projectId, Long evaluatorId);

    @Query("SELECT AVG(e.totalScore) FROM Evaluation e")
    Double getAverageScore();

    @Query("SELECT e.grade, COUNT(e) FROM Evaluation e GROUP BY e.grade")
    List<Object[]> countByGrade();
}
