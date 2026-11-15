package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record ExportCriterionCheckResponse(
        String key,
        String label,
        BigDecimal basePercentage,
        BigDecimal tolerancePercentage,
        BigDecimal measuredPercentage,
        String status,
        String note
) {
}
