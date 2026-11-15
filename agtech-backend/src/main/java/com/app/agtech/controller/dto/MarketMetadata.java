package com.app.agtech.controller.dto;

import java.time.Instant;
import java.util.List;

public record MarketMetadata(
        String provider,
        String attribution,
        Instant fetchedAt,
        boolean stale,
        List<String> warnings
) {
}
