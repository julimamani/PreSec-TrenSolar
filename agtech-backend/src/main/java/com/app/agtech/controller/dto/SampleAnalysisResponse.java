package com.app.agtech.controller.dto;

import com.app.agtech.domain.entity.SampleAnalysis;
import com.app.agtech.domain.enums.AnalysisStatus;

import java.time.Instant;
import java.util.UUID;

public record SampleAnalysisResponse(
        UUID id,
        UUID batchId,
        String originalImageUrl,
        AnalysisStatus status,
        Instant createdAt,
        InferenceResultResponse inferenceResult
) {

    public static SampleAnalysisResponse from(SampleAnalysis sampleAnalysis, UUID batchId) {
        InferenceResultResponse result = sampleAnalysis.getInferenceResult() == null
                ? null
                : InferenceResultResponse.from(sampleAnalysis.getInferenceResult());

        return new SampleAnalysisResponse(
                sampleAnalysis.getId(),
                batchId,
                sampleAnalysis.getOriginalImageUrl(),
                sampleAnalysis.getStatus(),
                sampleAnalysis.getCreatedAt(),
                result
        );
    }
}
