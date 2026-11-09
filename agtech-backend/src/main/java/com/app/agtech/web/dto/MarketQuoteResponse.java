package com.app.agtech.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record MarketQuoteResponse(
        String id,
        String grain,
        String venue,
        BigDecimal priceUsd,
        BigDecimal changePct,
        BigDecimal volumeTons,
        BigDecimal basisUsd,
        Instant updatedAt,
        String source
) {
}
