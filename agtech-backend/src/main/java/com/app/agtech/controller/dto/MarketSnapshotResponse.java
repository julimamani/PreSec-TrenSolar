package com.app.agtech.controller.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MarketSnapshotResponse(
        Instant updatedAt,
        BigDecimal usdArs,
        BigDecimal index,
        BigDecimal indexChangePct,
        BigDecimal volumeTons,
        long operations,
        BigDecimal openInterestTons,
        List<MarketQuoteResponse> quotes,
        List<MarketPricePointResponse> series,
        List<MarketVolumePointResponse> volumeSeries,
        List<MarketRegionResponse> regions,
        List<MarketQualityAxisResponse> qualityProfile,
        List<MarketQualityVsMarketResponse> qualityVsMarket,
        MarketMetadata metadata
) {
}
