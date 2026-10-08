package com.projectevaluation.repository;

import com.projectevaluation.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByProjectIdOrderByCreatedAtDesc(Long projectId);
    List<Approval> findByApproverId(Long approverId);
    long countByApproverIdAndStatus(Long approverId, Approval.ApprovalStatus status);
}
