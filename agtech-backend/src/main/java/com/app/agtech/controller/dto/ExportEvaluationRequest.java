package com.app.agtech.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;

import java.util.Map;

public record ExportEvaluationRequest(
        @Pattern(regexp = "(?i)poroto", message = "Only poroto is supported in this MVP")
        String grain,

        @DecimalMin("0.0")
        @DecimalMax("100.0")
        Double exportPercentage,

        @DecimalMin("0.0")
        @DecimalMax("100.0")
        Double discardPercentage,

        Map<String, Object> defectDetails
) {
}
