package com.projectevaluation.repository;
import com.projectevaluation.entity.Section;
import com.projectevaluation.entity.Team;
import com.projectevaluation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findBySection(Section section);
    List<Team> findBySectionId(Long sectionId);
    @Query("SELECT t FROM Team t JOIN t.clusterHeads ch WHERE ch = :user")
    List<Team> findByClusterHead(@Param("user") User user);
    @Query("SELECT t FROM Team t JOIN t.members m WHERE m = :user")
    List<Team> findByMember(@Param("user") User user);
}
