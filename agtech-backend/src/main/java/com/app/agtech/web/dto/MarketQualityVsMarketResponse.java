package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record MarketQualityVsMarketResponse(
        String grain,
        BigDecimal pizarra,
        BigDecimal calidad,
        BigDecimal premium
) {
}
