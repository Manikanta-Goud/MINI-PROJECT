package com.projectevaluation.repository;
import com.projectevaluation.entity.Section;
import com.projectevaluation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface SectionRepository extends JpaRepository<Section, Long> {
    List<Section> findByMentor(User mentor);
    Optional<Section> findByName(String name);
    boolean existsByName(String name);
    boolean existsByCluster_IdAndName(Long clusterId, String name);
}
