package com.app.agtech.controller.dto;

import java.math.BigDecimal;

public record MarketQualityAxisResponse(
        String axis,
        BigDecimal sample,
        BigDecimal benchmark
) {
}
