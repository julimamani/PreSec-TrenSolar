package com.app.backend.web.dto;

import java.math.BigDecimal;

public record MarketQualityAxisResponse(
        String axis,
        BigDecimal sample,
        BigDecimal benchmark
) {
}
