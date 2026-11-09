package com.app.agtech.controller.dto;

import java.math.BigDecimal;

public record MarketQualityVsMarketResponse(
        String grain,
        BigDecimal pizarra,
        BigDecimal calidad,
        BigDecimal premium
) {
}
