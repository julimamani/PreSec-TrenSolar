package com.app.backend.integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

/**
 * One market-data entry returned by Matba Rofex.
 *
 * <p>The REST API returns {@code marketData.LA} as an object with a
 * {@code price}, {@code size} and {@code date} (epoch milliseconds).</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MatbaRofexPrice(
        BigDecimal price,
        Long size,
        Long date
) {
}
