package com.projectevaluation.repository;

import com.projectevaluation.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStudentId(Long studentId);
    List<Project> findByMentorId(Long mentorId);
    List<Project> findByClusterHeadId(Long clusterHeadId);
    Optional<Project> findByProjectCode(String projectCode);
    boolean existsByProjectCode(String projectCode);

    List<Project> findByStatus(Project.ProjectStatus status);

    @Query("SELECT p FROM Project p WHERE p.mentor.id = :mentorId AND p.status IN :statuses")
    List<Project> findByMentorIdAndStatusIn(@Param("mentorId") Long mentorId,
                                             @Param("statuses") List<Project.ProjectStatus> statuses);

    @Query("SELECT p FROM Project p WHERE p.clusterHead.id = :chId AND p.status IN :statuses")
    List<Project> findByClusterHeadIdAndStatusIn(@Param("chId") Long chId,
                                                  @Param("statuses") List<Project.ProjectStatus> statuses);

    @Query("SELECT p FROM Project p WHERE " +
           "(LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.projectCode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.domain) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Project> searchProjects(@Param("search") String search, Pageable pageable);

    @Query("SELECT p.status, COUNT(p) FROM Project p GROUP BY p.status")
    List<Object[]> countByStatus();

    @Query("SELECT p.domain, COUNT(p) FROM Project p GROUP BY p.domain")
    List<Object[]> countByDomain();

    @Query("SELECT COUNT(p) FROM Project p WHERE p.mentor.id = :mentorId")
    long countByMentorId(@Param("mentorId") Long mentorId);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.mentor.id = :mentorId AND p.status IN :statuses")
    long countByMentorIdAndStatusIn(@Param("mentorId") Long mentorId,
                                    @Param("statuses") List<Project.ProjectStatus> statuses);

    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.student.id = :studentId")
    List<Project> findProjectsWhereStudentIsMember(@Param("studentId") Long studentId);
}
