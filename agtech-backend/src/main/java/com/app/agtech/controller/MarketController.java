package com.app.agtech.controller;

import com.app.agtech.service.MarketDataService;
import com.app.agtech.controller.dto.MarketSnapshotResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MarketController {

    private final MarketDataService marketDataService;

    public MarketController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping({"/api/market-snapshot", "/api/market/snapshot"})
    public MarketSnapshotResponse snapshot() {
        return marketDataService.getSnapshot();
    }
}
