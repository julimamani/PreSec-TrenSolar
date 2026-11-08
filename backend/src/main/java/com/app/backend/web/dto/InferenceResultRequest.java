package com.app.backend.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record InferenceResultRequest(
        @NotNull UUID sampleAnalysisId,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") Double exportPercentage,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") Double discardPercentage,
        @NotNull Map<String, Object> defectDetails,
        @NotBlank @Size(max = 2048) String heatmapImageUrl
) {
}
