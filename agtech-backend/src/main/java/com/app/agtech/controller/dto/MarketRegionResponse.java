package com.app.agtech.controller.dto;

import java.math.BigDecimal;

public record MarketRegionResponse(
        String region,
        BigDecimal basisUsd,
        BigDecimal volumeTons
) {
}
