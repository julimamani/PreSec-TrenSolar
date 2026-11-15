package com.app.agtech.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record FinancialImpactRequest(
        @NotBlank
        @Pattern(regexp = "poroto", message = "Only poroto is supported in this MVP")
        String grain,

        @NotNull
        @Positive
        Double tons,

        @NotNull
        @DecimalMin("0.0")
        @DecimalMax("100.0")
        Double defectPercentage,

        @Pattern(regexp = "rosario|buenos-aires|cbot|global", message = "Unsupported venue")
        String venue
) {
}
