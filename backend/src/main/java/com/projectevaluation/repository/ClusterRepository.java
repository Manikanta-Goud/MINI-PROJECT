package com.projectevaluation.repository;

import com.projectevaluation.entity.Cluster;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClusterRepository extends JpaRepository<Cluster, Long> {
    Optional<Cluster> findByNameIgnoreCase(String name);
    Optional<Cluster> findByClusterHead_Id(Long clusterHeadId);
    boolean existsByNameIgnoreCase(String name);
}
