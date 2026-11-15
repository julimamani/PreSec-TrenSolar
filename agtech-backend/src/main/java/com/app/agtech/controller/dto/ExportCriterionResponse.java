package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record ExportCriterionResponse(
        String key,
        String label,
        BigDecimal basePercentage,
        BigDecimal tolerancePercentage,
        BigDecimal bonusRatePerPoint,
        BigDecimal rebateRatePerPoint,
        String note
) {
}
