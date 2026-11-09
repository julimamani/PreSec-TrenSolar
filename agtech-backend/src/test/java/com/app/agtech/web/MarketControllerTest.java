package com.app.agtech.web;

import com.app.agtech.service.MarketDataService;
import com.app.agtech.web.dto.MarketMetadata;
import com.app.agtech.web.dto.MarketSnapshotResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MarketControllerTest {

    @Test
    void exposesSnapshotContractForFrontend() throws Exception {
        MarketDataService marketDataService = mock(MarketDataService.class);
        when(marketDataService.getSnapshot()).thenReturn(new MarketSnapshotResponse(
                Instant.parse("2026-11-08T12:00:00Z"),
                new BigDecimal("1536.50"),
                new BigDecimal("300.00"),
                new BigDecimal("1.20"),
                BigDecimal.ZERO,
                0,
                BigDecimal.ZERO,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                new MarketMetadata(
                        "Matba Rofex + DolarAPI",
                        "Matba Rofex · DolarAPI · spot regional",
                        Instant.now(),
                        false,
                        List.of()
                )
        ));

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(new MarketController(marketDataService))
                .build();

        mockMvc.perform(get("/api/market-snapshot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usdArs").value(1536.50))
                .andExpect(jsonPath("$.metadata.provider").value("Matba Rofex + DolarAPI"))
                .andExpect(jsonPath("$.quotes").isArray());
    }
}
