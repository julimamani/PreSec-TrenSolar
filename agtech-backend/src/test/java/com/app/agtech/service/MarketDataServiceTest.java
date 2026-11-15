package com.app.agtech.service;

import com.app.agtech.config.CacheConfig;
import com.app.agtech.config.MarketProperties;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.exception.MarketDataException;
import com.app.agtech.integration.CacPizarraClient;
import com.app.agtech.integration.DolarApiClient;
import com.app.agtech.integration.MatbaRofexClient;
import com.app.agtech.controller.dto.MarketQuoteResponse;
import com.app.agtech.controller.dto.MarketSnapshotResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketDataServiceTest {

    private MatbaRofexClient matbaRofexClient;
    private DolarApiClient dolarApiClient;
    private CacPizarraClient cacPizarraClient;
    private MarketProperties properties;

    @BeforeEach
    void setUp() {
        matbaRofexClient = mock(MatbaRofexClient.class);
        dolarApiClient = mock(DolarApiClient.class);
        cacPizarraClient = mock(CacPizarraClient.class);
        properties = new MarketProperties(
                90,
                Duration.ofMinutes(15),
                Duration.ofSeconds(1),
                Duration.ofSeconds(5),
                "Matba Rofex + DolarAPI",
                "Matba Rofex · DolarAPI · spot regional",
                new BigDecimal("0.04"),
                new BigDecimal("1250.00"),
                new BigDecimal("450.00"),
                new BigDecimal("200.00"),
                new BigDecimal("220.00"),
                new BigDecimal("1500.00")
        );
    }

    @Test
    void buildsSnapshotWithAllReferenceGrainsWhenPizarraAndMatbaAreMissing() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(cacPizarraClient.fetchPorotoPizarraArs()).thenReturn(Optional.empty());

        MarketDataService service = service();
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(0, new BigDecimal("1500.00").compareTo(snapshot.usdArs()));
        assertEquals(4, snapshot.quotes().size());

        MarketQuoteResponse poroto = quote(snapshot, "poroto");
        assertEquals(0, new BigDecimal("1250.00").compareTo(poroto.priceUsd()));
        assertEquals("rosario", poroto.venue());
        assertEquals("spot regional", poroto.source());

        assertEquals(0, new BigDecimal("450.00").compareTo(quote(snapshot, "soja").priceUsd()));
        assertEquals(0, new BigDecimal("220.00").compareTo(quote(snapshot, "trigo").priceUsd()));
        assertEquals(0, new BigDecimal("200.00").compareTo(quote(snapshot, "maiz").priceUsd()));

        assertEquals(1, snapshot.series().size());
        assertEquals(0, new BigDecimal("1250.00").compareTo(snapshot.series().get(0).poroto()));
        assertEquals(0, new BigDecimal("450.00").compareTo(snapshot.series().get(0).soja()));
        assertEquals(0, new BigDecimal("220.00").compareTo(snapshot.series().get(0).trigo()));
        assertEquals(0, new BigDecimal("200.00").compareTo(snapshot.series().get(0).maiz()));

        assertFalse(snapshot.metadata().stale());
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("Poroto")));
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("volumen")));

        verify(matbaRofexClient, times(3)).fetchLastPrice(any(MarketGrain.class));
        verify(cacPizarraClient).fetchPorotoPizarraArs();
    }

    @Test
    void convertsTheCamaraArbitralPizarraToUsdWhenAvailable() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(cacPizarraClient.fetchPorotoPizarraArs()).thenReturn(Optional.of(new BigDecimal("1500000")));

        MarketDataService service = service();
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(4, snapshot.quotes().size());
        MarketQuoteResponse poroto = quote(snapshot, "poroto");
        assertEquals(0, new BigDecimal("1000.00").compareTo(poroto.priceUsd()));
        assertEquals("Cámara Arbitral pizarra", poroto.source());
    }

    @Test
    void fallsBackToConfiguredSpotWhenPizarraFails() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(cacPizarraClient.fetchPorotoPizarraArs())
                .thenThrow(new MarketDataException("offline"));

        MarketDataService service = service();
        MarketSnapshotResponse snapshot = service.getSnapshot();

        MarketQuoteResponse poroto = quote(snapshot, "poroto");
        assertEquals(0, new BigDecimal("1250.00").compareTo(poroto.priceUsd()));
        assertEquals("spot regional", poroto.source());
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("offline")));
    }

    @Test
    void usesDolarApiFallbackWhenExchangeRateFails() {
        when(dolarApiClient.fetchMayoristaVenta()).thenThrow(new MarketDataException("offline"));
        when(cacPizarraClient.fetchPorotoPizarraArs()).thenReturn(Optional.empty());

        MarketDataService service = service();
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(0, new BigDecimal("1500.00").compareTo(snapshot.usdArs()));
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("DolarAPI")));
    }

    @Test
    void cachesTheMarketSnapshotForFifteenMinutes() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(cacPizarraClient.fetchPorotoPizarraArs()).thenReturn(Optional.empty());

        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(MarketProperties.class, () -> properties);
            context.registerBean(MatbaRofexClient.class, () -> matbaRofexClient);
            context.registerBean(DolarApiClient.class, () -> dolarApiClient);
            context.registerBean(CacPizarraClient.class, () -> cacPizarraClient);
            context.registerBean(MarketDataService.class);
            context.register(CacheConfig.class);
            context.refresh();

            MarketDataService service = context.getBean(MarketDataService.class);

            MarketSnapshotResponse first = service.getSnapshot();
            MarketSnapshotResponse second = service.getSnapshot();

            assertEquals(first.updatedAt(), second.updatedAt());
            verify(dolarApiClient, times(1)).fetchMayoristaVenta();
            verify(cacPizarraClient, times(1)).fetchPorotoPizarraArs();
            verify(matbaRofexClient, times(3)).fetchLastPrice(any(MarketGrain.class));
        }
    }

    private MarketDataService service() {
        return new MarketDataService(matbaRofexClient, dolarApiClient, cacPizarraClient, properties);
    }

    private MarketQuoteResponse quote(MarketSnapshotResponse snapshot, String grain) {
        return snapshot.quotes().stream()
                .filter(quote -> quote.grain().equals(grain))
                .findFirst()
                .orElseThrow();
    }
}
