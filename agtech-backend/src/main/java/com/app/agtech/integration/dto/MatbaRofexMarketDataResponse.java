package com.app.agtech.integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Response returned by {@code GET /rest/marketdata/get}.
 *
 * <p>Example:
 * {@code {"status":"OK","marketData":{"LA":{"price":45465,"size":1,"date":1571491925262}},"depth":1}}</p>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MatbaRofexMarketDataResponse(
        String status,
        Map<String, MatbaRofexPrice> marketData,
        Integer depth,
        Boolean aggregated
) {
}
