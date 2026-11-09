package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record MarketQualityAxisResponse(
        String axis,
        BigDecimal sample,
        BigDecimal benchmark
) {
}
