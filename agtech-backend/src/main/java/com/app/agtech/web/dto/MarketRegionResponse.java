package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record MarketRegionResponse(
        String region,
        BigDecimal basisUsd,
        BigDecimal volumeTons
) {
}
