package com.app.agtech.repository;

import com.app.agtech.domain.entity.InferenceResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InferenceResultRepository extends JpaRepository<InferenceResult, UUID> {

    Optional<InferenceResult> findBySampleAnalysisId(UUID sampleAnalysisId);

    boolean existsBySampleAnalysisId(UUID sampleAnalysisId);
}
