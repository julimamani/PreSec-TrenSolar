package com.app.agtech.controller.dto;

import com.app.agtech.domain.entity.InferenceResult;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record InferenceResultDetailResponse(
        UUID id,
        UUID sampleAnalysisId,
        Double exportPercentage,
        Double discardPercentage,
        Map<String, Object> defectDetails,
        String heatmapImageUrl,
        Instant createdAt,
        Instant updatedAt
) {

    public static InferenceResultDetailResponse from(InferenceResult result) {
        return new InferenceResultDetailResponse(
                result.getId(),
                result.getSampleAnalysis().getId(),
                result.getExportPercentage(),
                result.getDiscardPercentage(),
                result.getDefectDetails(),
                result.getHeatmapImageUrl(),
                result.getCreatedAt(),
                result.getUpdatedAt()
        );
    }
}
