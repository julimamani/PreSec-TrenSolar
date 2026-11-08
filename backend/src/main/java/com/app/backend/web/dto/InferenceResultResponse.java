package com.app.backend.web.dto;

import com.app.backend.domain.entity.InferenceResult;

import java.util.Map;
import java.util.UUID;

public record InferenceResultResponse(
        UUID id,
        Double exportPercentage,
        Double discardPercentage,
        Map<String, Object> defectDetails,
        String heatmapImageUrl
) {

    public static InferenceResultResponse from(InferenceResult inferenceResult) {
        return new InferenceResultResponse(
                inferenceResult.getId(),
                inferenceResult.getExportPercentage(),
                inferenceResult.getDiscardPercentage(),
                inferenceResult.getDefectDetails(),
                inferenceResult.getHeatmapImageUrl()
        );
    }
}
