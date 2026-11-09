package com.app.agtech.service;

import com.app.agtech.config.CacheConfig;
import com.app.agtech.config.MarketProperties;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.exception.MarketDataException;
import com.app.agtech.integration.DolarApiClient;
import com.app.agtech.integration.MatbaRofexClient;
import com.app.agtech.integration.dto.MatbaRofexQuote;
import com.app.agtech.controller.dto.MarketQuoteResponse;
import com.app.agtech.controller.dto.MarketSnapshotResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MarketDataServiceTest {

    private MatbaRofexClient matbaRofexClient;
    private DolarApiClient dolarApiClient;
    private MarketProperties properties;

    @BeforeEach
    void setUp() {
        matbaRofexClient = mock(MatbaRofexClient.class);
        dolarApiClient = mock(DolarApiClient.class);
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
    void buildsHybridSnapshotWithExactlyFourGrainsAndPorotoSpot() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.SOJA)).thenReturn(Optional.of(
                new MatbaRofexQuote(
                        "SOJ.ROS/FEB27",
                        new BigDecimal("470.00"),
                        Instant.parse("2026-11-08T12:00:00Z")
                )
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.TRIGO)).thenReturn(Optional.of(
                new MatbaRofexQuote(
                        "TRI.BUE/ENE27",
                        new BigDecimal("250.00"),
                        Instant.parse("2026-11-08T12:00:00Z")
                )
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.MAIZ)).thenReturn(Optional.of(
                new MatbaRofexQuote(
                        "MAI.ROS/ABR27",
                        new BigDecimal("210.00"),
                        Instant.parse("2026-11-08T12:00:00Z")
                )
        ));

        MarketDataService service = new MarketDataService(matbaRofexClient, dolarApiClient, properties);
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(0, new BigDecimal("1500.00").compareTo(snapshot.usdArs()));
        assertEquals(4, snapshot.quotes().size());

        MarketQuoteResponse poroto = quote(snapshot, "poroto");
        assertEquals(0, new BigDecimal("1250.00").compareTo(poroto.priceUsd()));
        assertEquals("rosario", poroto.venue());
        assertEquals("spot regional", poroto.source());

        MarketQuoteResponse soja = quote(snapshot, "soja");
        assertEquals(0, new BigDecimal("470.00").compareTo(soja.priceUsd()));
        assertEquals("global", soja.venue());
        assertEquals("Matba Rofex", soja.source());

        assertEquals(0, new BigDecimal("250.00").compareTo(quote(snapshot, "trigo").priceUsd()));
        assertEquals(0, new BigDecimal("210.00").compareTo(quote(snapshot, "maiz").priceUsd()));

        assertEquals(1, snapshot.series().size());
        assertEquals(0, new BigDecimal("470.00").compareTo(snapshot.series().get(0).soja()));
        assertEquals(0, new BigDecimal("250.00").compareTo(snapshot.series().get(0).trigo()));
        assertEquals(0, new BigDecimal("1250.00").compareTo(snapshot.series().get(0).poroto()));

        assertFalse(snapshot.metadata().stale());
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("Poroto")));
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("Last Price")));

        verify(matbaRofexClient, never()).fetchLastPrice(MarketGrain.POROTO);
        verify(matbaRofexClient).fetchLastPrice(MarketGrain.SOJA);
        verify(matbaRofexClient).fetchLastPrice(MarketGrain.TRIGO);
        verify(matbaRofexClient).fetchLastPrice(MarketGrain.MAIZ);
    }

    @Test
    void usesExplicitFallbacksWhenMatbaRofexFails() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.SOJA))
                .thenThrow(new MarketDataException("timeout"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.TRIGO))
                .thenThrow(new MarketDataException("no available contract"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.MAIZ))
                .thenThrow(new MarketDataException("authentication failed"));

        MarketDataService service = new MarketDataService(matbaRofexClient, dolarApiClient, properties);
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(4, snapshot.quotes().size());
        assertEquals(0, new BigDecimal("450.00").compareTo(quote(snapshot, "soja").priceUsd()));
        assertEquals(0, new BigDecimal("220.00").compareTo(quote(snapshot, "trigo").priceUsd()));
        assertEquals(0, new BigDecimal("200.00").compareTo(quote(snapshot, "maiz").priceUsd()));
        assertEquals(0, new BigDecimal("1250.00").compareTo(quote(snapshot, "poroto").priceUsd()));
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("timeout")));
        assertTrue(snapshot.metadata().warnings().stream()
                .anyMatch(warning -> warning.contains("authentication failed")));
    }

    @Test
    void usesDolarApiFallbackWhenExchangeRateFails() {
        when(dolarApiClient.fetchMayoristaVenta()).thenThrow(new MarketDataException("offline"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.SOJA)).thenReturn(Optional.of(
                new MatbaRofexQuote("SOJ.ROS/FEB27", new BigDecimal("470.00"), Instant.now())
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.TRIGO)).thenReturn(Optional.of(
                new MatbaRofexQuote("TRI.BUE/ENE27", new BigDecimal("250.00"), Instant.now())
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.MAIZ)).thenReturn(Optional.of(
                new MatbaRofexQuote("MAI.ROS/ABR27", new BigDecimal("210.00"), Instant.now())
        ));

        MarketDataService service = new MarketDataService(matbaRofexClient, dolarApiClient, properties);
        MarketSnapshotResponse snapshot = service.getSnapshot();

        assertEquals(0, new BigDecimal("1500.00").compareTo(snapshot.usdArs()));
        assertTrue(snapshot.metadata().warnings().stream().anyMatch(warning -> warning.contains("DolarAPI")));
    }

    @Test
    void cachesTheMarketSnapshotForFifteenMinutes() {
        when(dolarApiClient.fetchMayoristaVenta()).thenReturn(new BigDecimal("1500.00"));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.SOJA)).thenReturn(Optional.of(
                new MatbaRofexQuote("SOJ.ROS/FEB27", new BigDecimal("470.00"), Instant.now())
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.TRIGO)).thenReturn(Optional.of(
                new MatbaRofexQuote("TRI.BUE/ENE27", new BigDecimal("250.00"), Instant.now())
        ));
        when(matbaRofexClient.fetchLastPrice(MarketGrain.MAIZ)).thenReturn(Optional.of(
                new MatbaRofexQuote("MAI.ROS/ABR27", new BigDecimal("210.00"), Instant.now())
        ));

        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.registerBean(MarketProperties.class, () -> properties);
            context.registerBean(MatbaRofexClient.class, () -> matbaRofexClient);
            context.registerBean(DolarApiClient.class, () -> dolarApiClient);
            context.registerBean(MarketDataService.class);
            context.register(CacheConfig.class);
            context.refresh();

            MarketDataService service = context.getBean(MarketDataService.class);

            MarketSnapshotResponse first = service.getSnapshot();
            MarketSnapshotResponse second = service.getSnapshot();

            assertEquals(first.updatedAt(), second.updatedAt());
            verify(dolarApiClient, times(1)).fetchMayoristaVenta();
            verify(matbaRofexClient, times(1)).fetchLastPrice(MarketGrain.SOJA);
            verify(matbaRofexClient, times(1)).fetchLastPrice(MarketGrain.TRIGO);
            verify(matbaRofexClient, times(1)).fetchLastPrice(MarketGrain.MAIZ);
        }
    }

    private MarketQuoteResponse quote(MarketSnapshotResponse snapshot, String grain) {
        return snapshot.quotes().stream()
                .filter(quote -> grain.equals(quote.grain()))
                .findFirst()
                .orElseThrow();
    }
}
