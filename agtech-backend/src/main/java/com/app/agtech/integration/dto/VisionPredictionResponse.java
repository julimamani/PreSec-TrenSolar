package com.app.agtech.integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VisionPredictionResponse(
        @JsonProperty("export_percentage") Double exportPercentage,
        @JsonProperty("discard_percentage") Double discardPercentage,
        @JsonProperty("defect_details") Map<String, Object> defectDetails,
        @JsonProperty("heatmap_image_url") String heatmapImageUrl
) {
}
