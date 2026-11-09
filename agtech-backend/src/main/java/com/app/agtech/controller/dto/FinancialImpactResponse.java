package com.app.agtech.controller.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FinancialImpactResponse(
        String grain,
        String venue,
        BigDecimal priceUsdTon,
        BigDecimal exchangeRateUsed,
        BigDecimal defectPercentage,
        BigDecimal penaltyFactor,
        BigDecimal lossUsd,
        BigDecimal lossArs,
        String source,
        Instant calculatedAt
) {
}
