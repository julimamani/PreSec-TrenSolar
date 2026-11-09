package com.app.backend.web.dto;

import java.math.BigDecimal;

public record MarketRegionResponse(
        String region,
        BigDecimal basisUsd,
        BigDecimal volumeTons
) {
}
