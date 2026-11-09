package com.app.agtech.integration.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Normalized last-price quote extracted from Matba Rofex.
 */
public record MatbaRofexQuote(
        String symbol,
        BigDecimal price,
        Instant timestamp
) {
}
