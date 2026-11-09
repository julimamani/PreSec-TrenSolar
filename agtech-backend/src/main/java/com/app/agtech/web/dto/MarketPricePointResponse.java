package com.app.agtech.web.dto;

import java.math.BigDecimal;

public record MarketPricePointResponse(
        String date,
        String label,
        BigDecimal soja,
        BigDecimal maiz,
        BigDecimal trigo,
        BigDecimal poroto
) {
}
