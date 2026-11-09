package com.app.backend.web.dto;

import java.math.BigDecimal;

public record MarketVolumePointResponse(
        String label,
        BigDecimal soja,
        BigDecimal maiz,
        BigDecimal trigo,
        BigDecimal poroto
) {
}
