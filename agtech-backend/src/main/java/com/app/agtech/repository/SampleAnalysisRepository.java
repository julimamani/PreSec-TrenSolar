package com.app.agtech.repository;

import com.app.agtech.domain.entity.SampleAnalysis;
import com.app.agtech.domain.enums.AnalysisStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SampleAnalysisRepository extends JpaRepository<SampleAnalysis, UUID> {

    List<SampleAnalysis> findByBatchId(UUID batchId);

    Page<SampleAnalysis> findByBatchId(UUID batchId, Pageable pageable);

    Optional<SampleAnalysis> findByIdAndBatchId(UUID id, UUID batchId);

    List<SampleAnalysis> findByStatus(AnalysisStatus status);

    long countByBatchId(UUID batchId);
}
