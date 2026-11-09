package com.app.agtech.service;

import com.app.agtech.controller.dto.FinancialImpactRequest;
import com.app.agtech.controller.dto.FinancialImpactResponse;
import com.app.agtech.controller.dto.MarketMetadata;
import com.app.agtech.controller.dto.MarketQuoteResponse;
import com.app.agtech.controller.dto.MarketSnapshotResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FinancialAgentServiceTest {

    @Test
    void calculatesLossWithTheCachedGrainPriceAndExchangeRate() {
        MarketDataService marketDataService = mock(MarketDataService.class);
        when(marketDataService.getSnapshot()).thenReturn(snapshot());

        FinancialAgentService service = new FinancialAgentService(marketDataService, new BigDecimal("0.60"));
        FinancialImpactResponse response = service.calculateImpact(
                new FinancialImpactRequest("soja", 10.0, 15.0, "global")
        );

        assertEquals(0, new BigDecimal("405.00").compareTo(response.lossUsd()));
        assertEquals(0, new BigDecimal("607500.00").compareTo(response.lossArs()));
        assertEquals("Matba Rofex", response.source());
    }

    @Test
    void usesThePriceOfTheUploadedGrainOnly() {
        MarketDataService marketDataService = mock(MarketDataService.class);
        when(marketDataService.getSnapshot()).thenReturn(snapshot());

        FinancialAgentService service = new FinancialAgentService(marketDataService, new BigDecimal("0.60"));
        FinancialImpactResponse response = service.calculateImpact(
                new FinancialImpactRequest("maiz", 10.0, 15.0, "global")
        );

        assertEquals(0, new BigDecimal("200.00").compareTo(response.priceUsdTon()));
        assertEquals(0, new BigDecimal("180.00").compareTo(response.lossUsd()));
        assertEquals(0, new BigDecimal("270000.00").compareTo(response.lossArs()));
    }

    private MarketSnapshotResponse snapshot() {
        Instant now = Instant.now();
        return new MarketSnapshotResponse(
                now,
                new BigDecimal("1500.00"),
                new BigDecimal("500.00"),
                new BigDecimal("1.00"),
                BigDecimal.ZERO,
                0,
                BigDecimal.ZERO,
                List.of(
                        new MarketQuoteResponse(
                                "soja-global",
                                "soja",
                                "global",
                                new BigDecimal("450.00"),
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                now,
                                "Matba Rofex"
                        ),
                        new MarketQuoteResponse(
                                "maiz-global",
                                "maiz",
                                "global",
                                new BigDecimal("200.00"),
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                now,
                                "Matba Rofex"
                        )
                ),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                new MarketMetadata(
                        "Matba Rofex + DolarAPI",
                        "Matba Rofex · DolarAPI · spot regional",
                        now,
                        false,
                        List.of()
                )
        );
    }
}
