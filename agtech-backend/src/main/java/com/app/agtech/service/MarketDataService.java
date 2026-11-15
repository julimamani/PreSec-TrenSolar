package com.app.agtech.service;

import com.app.agtech.config.CacheConfig;
import com.app.agtech.config.MarketProperties;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.exception.MarketDataException;
import com.app.agtech.integration.CacPizarraClient;
import com.app.agtech.integration.DolarApiClient;
import com.app.agtech.integration.MatbaRofexClient;
import com.app.agtech.integration.dto.MatbaRofexQuote;
import com.app.agtech.controller.dto.MarketMetadata;
import com.app.agtech.controller.dto.MarketPricePointResponse;
import com.app.agtech.controller.dto.MarketQualityAxisResponse;
import com.app.agtech.controller.dto.MarketQualityVsMarketResponse;
import com.app.agtech.controller.dto.MarketQuoteResponse;
import com.app.agtech.controller.dto.MarketSnapshotResponse;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Hybrid market agent used by the dashboard and by the financial impact API.
 *
 * <ul>
 *   <li>Poroto: Cámara Arbitral de Cereales board price (ARS/t converted with
 *       the mayorista rate), falling back to the configured regional spot
 *       (USD 1250/t by default).</li>
 *   <li>Soja, Trigo and Maíz: Matba Rofex last price (entry {@code LA}) for the
 *       configured nearby futures, with explicit USD fallbacks. Remove a grain
 *       from {@link #MARKET_GRAINS} to hide it from the dashboard.</li>
 *   <li>USD/ARS: DolarAPI mayorista.</li>
 *   <li>Cache: Spring Cache ("marketCache") with a 15-minute minimum TTL.</li>
 * </ul>
 */
@Service
public class MarketDataService {

    // Keep the dashboard populated with the four reference grains. Poroto stays
    // first because it is the focus of the MVP analysis flow.
    private static final List<MarketGrain> MARKET_GRAINS = List.of(
            MarketGrain.POROTO,
            MarketGrain.SOJA,
            MarketGrain.TRIGO,
            MarketGrain.MAIZ
    );
    private static final Map<MarketGrain, String> GRAIN_LABELS = Map.of(
            MarketGrain.SOJA, "Soja",
            MarketGrain.MAIZ, "Maíz",
            MarketGrain.TRIGO, "Trigo",
            MarketGrain.POROTO, "Poroto"
    );
    private static final DateTimeFormatter LABEL_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM", Locale.forLanguageTag("es-AR"));

    private final MatbaRofexClient matbaRofexClient;
    private final DolarApiClient dolarApiClient;
    private final CacPizarraClient cacPizarraClient;
    private final MarketProperties properties;

    private volatile MarketSnapshotResponse lastSnapshot;

    public MarketDataService(
            MatbaRofexClient matbaRofexClient,
            DolarApiClient dolarApiClient,
            CacPizarraClient cacPizarraClient,
            MarketProperties properties
    ) {
        this.matbaRofexClient = matbaRofexClient;
        this.dolarApiClient = dolarApiClient;
        this.cacPizarraClient = cacPizarraClient;
        this.properties = properties;
    }

    /**
     * Full snapshot consumed by {@code GET /api/market-snapshot}.
     *
     * <p>The Spring cache entry also protects DolarAPI and Matba Rofex from
     * repeated calls during the demo. The financial agent reuses this snapshot,
     * so it sees exactly the same prices and exchange rate.</p>
     */
    @Cacheable(cacheNames = CacheConfig.MARKET_CACHE, key = "'market-snapshot'")
    public MarketSnapshotResponse getSnapshot() {
        try {
            MarketSnapshotResponse snapshot = buildSnapshot();
            lastSnapshot = snapshot;
            return snapshot;
        } catch (RuntimeException exception) {
            if (lastSnapshot != null) {
                return staleCopy(lastSnapshot, exception);
            }
            throw exception;
        }
    }

    private MarketSnapshotResponse buildSnapshot() {
        List<String> warnings = new ArrayList<>();
        Instant now = Instant.now();

        BigDecimal usdArs = resolveExchangeRate(warnings);
        Map<MarketGrain, CommodityResult> results = new EnumMap<>(MarketGrain.class);

        for (MarketGrain grain : MARKET_GRAINS) {
            CommodityResult result = grain == MarketGrain.POROTO
                    ? porotoQuote(usdArs)
                    : matbaRofexQuote(grain);
            results.put(grain, result);
            addWarning(warnings, result.warning());
        }

        List<MarketQuoteResponse> quotes = MARKET_GRAINS.stream()
                .map(grain -> toQuote(grain, results.get(grain), now))
                .toList();

        List<MarketPricePointResponse> series = buildSeries(results);
        List<MarketQualityVsMarketResponse> qualityVsMarket = qualityVsMarket(quotes);

        warnings.add("Matba Rofex no entrega volumen, open interest ni basis regional "
                + "en esta integración; se devuelven en cero.");

        return new MarketSnapshotResponse(
                now,
                usdArs,
                average(quotes.stream().map(MarketQuoteResponse::priceUsd).toList()),
                average(quotes.stream().map(MarketQuoteResponse::changePct).toList()),
                BigDecimal.ZERO,
                0,
                BigDecimal.ZERO,
                quotes,
                series,
                List.of(),
                List.of(),
                qualityProfile(),
                qualityVsMarket,
                new MarketMetadata(
                        properties.provider(),
                        properties.attribution(),
                        now,
                        false,
                        List.copyOf(warnings)
                )
        );
    }

    private CommodityResult porotoQuote(BigDecimal usdArs) {
        String fallbackReason = null;
        try {
            Optional<BigDecimal> pizarraArs = cacPizarraClient.fetchPorotoPizarraArs();
            if (pizarraArs.isPresent() && usdArs != null && usdArs.signum() > 0) {
                BigDecimal usd = pizarraArs.get().divide(usdArs, 2, RoundingMode.HALF_UP);
                if (usd.signum() > 0) {
                    return new CommodityResult(
                            MarketGrain.POROTO,
                            usd,
                            Instant.now(),
                            "Cámara Arbitral pizarra",
                            null
                    );
                }
            }
        } catch (RuntimeException exception) {
            fallbackReason = safeMessage(exception);
        }

        BigDecimal price = money(properties.porotoSpotUsd());
        return new CommodityResult(
                MarketGrain.POROTO,
                price,
                Instant.now(),
                "spot regional",
                "Poroto: se usa el spot regional parametrizado USD "
                        + price.toPlainString() + "/t"
                        + (fallbackReason == null
                                ? "; no hay pizarra de Cámara Arbitral disponible."
                                : " (Cámara Arbitral: " + fallbackReason + ").")
        );
    }

    private CommodityResult matbaRofexQuote(MarketGrain grain) {
        try {
            Optional<MatbaRofexQuote> quote = matbaRofexClient.fetchLastPrice(grain);
            if (quote.isPresent()) {
                MatbaRofexQuote last = quote.get();
                return new CommodityResult(
                        grain,
                        money(last.price()),
                        last.timestamp() == null ? Instant.now() : last.timestamp(),
                        "Matba Rofex",
                        null
                );
            }
            return fallbackQuote(grain, "no devolvió Last Price para los futuros configurados");
        } catch (RuntimeException exception) {
            return fallbackQuote(grain, safeMessage(exception));
        }
    }

    private CommodityResult fallbackQuote(MarketGrain grain, String reason) {
        BigDecimal fallback = money(properties.fallbackFor(grain));
        return new CommodityResult(
                grain,
                fallback,
                Instant.now(),
                "fallback",
                grain.label() + ": " + reason
                        + ". Se usa el fallback USD " + fallback.toPlainString() + "/t."
        );
    }

    private BigDecimal resolveExchangeRate(List<String> warnings) {
        try {
            BigDecimal rate = dolarApiClient.fetchMayoristaVenta();
            if (rate == null || rate.signum() <= 0) {
                throw new MarketDataException("DolarAPI returned an invalid USD/ARS rate");
            }
            return money(rate);
        } catch (RuntimeException exception) {
            BigDecimal fallback = money(properties.usdArsFallback());
            addWarning(warnings, "DolarAPI: " + safeMessage(exception)
                    + " Se usa USD/ARS " + fallback.toPlainString() + " como respaldo.");
            return fallback;
        }
    }

    private MarketQuoteResponse toQuote(MarketGrain grain, CommodityResult result, Instant now) {
        String venue = grain == MarketGrain.POROTO ? "rosario" : "global";
        Instant updatedAt = result.updatedAt() == null ? now : result.updatedAt();

        return new MarketQuoteResponse(
                grain.id() + "-" + (grain == MarketGrain.POROTO ? "spot" : "matba"),
                grain.id(),
                venue,
                money(result.price()),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                updatedAt,
                result.source()
        );
    }

    /**
     * The external providers only expose the current price, so the chart contains
     * one point per snapshot instead of a fabricated history.
     */
    private List<MarketPricePointResponse> buildSeries(Map<MarketGrain, CommodityResult> results) {
        LocalDate date = LocalDate.now();
        return List.of(new MarketPricePointResponse(
                date.toString(),
                label(date),
                priceOf(results, MarketGrain.SOJA),
                priceOf(results, MarketGrain.MAIZ),
                priceOf(results, MarketGrain.TRIGO),
                priceOf(results, MarketGrain.POROTO)
        ));
    }

    private BigDecimal priceOf(Map<MarketGrain, CommodityResult> results, MarketGrain grain) {
        CommodityResult result = results.get(grain);
        return result == null ? null : money(result.price());
    }

    private List<MarketQualityAxisResponse> qualityProfile() {
        return List.of(
                new MarketQualityAxisResponse("Exportable", decimal("88.6"), decimal("90")),
                new MarketQualityAxisResponse("Proteína", decimal("82.4"), decimal("85")),
                new MarketQualityAxisResponse("Aceite", decimal("79.1"), decimal("80")),
                new MarketQualityAxisResponse("Peso hect.", decimal("91.2"), decimal("88")),
                new MarketQualityAxisResponse("Humedad ópt.", decimal("86.4"), decimal("88")),
                new MarketQualityAxisResponse("Limpieza", decimal("94.1"), decimal("92"))
        );
    }

    private List<MarketQualityVsMarketResponse> qualityVsMarket(List<MarketQuoteResponse> quotes) {
        BigDecimal factor = BigDecimal.ONE.add(properties.qualityPremiumRate());
        return quotes.stream()
                .filter(quote -> quote.priceUsd() != null)
                .map(quote -> {
                    BigDecimal qualityPrice = quote.priceUsd()
                            .multiply(factor)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new MarketQualityVsMarketResponse(
                            GRAIN_LABELS.getOrDefault(
                                    MarketGrain.find(quote.grain()).orElse(MarketGrain.SOJA),
                                    quote.grain()
                            ),
                            quote.priceUsd(),
                            qualityPrice,
                            qualityPrice.subtract(quote.priceUsd())
                    );
                })
                .toList();
    }

    private MarketSnapshotResponse staleCopy(MarketSnapshotResponse snapshot, RuntimeException exception) {
        List<String> warnings = new ArrayList<>(snapshot.metadata().warnings());
        warnings.add("No se pudo actualizar la fuente; se muestra la última copia disponible: "
                + safeMessage(exception));

        return new MarketSnapshotResponse(
                snapshot.updatedAt(),
                snapshot.usdArs(),
                snapshot.index(),
                snapshot.indexChangePct(),
                snapshot.volumeTons(),
                snapshot.operations(),
                snapshot.openInterestTons(),
                snapshot.quotes(),
                snapshot.series(),
                snapshot.volumeSeries(),
                snapshot.regions(),
                snapshot.qualityProfile(),
                snapshot.qualityVsMarket(),
                new MarketMetadata(
                        snapshot.metadata().provider(),
                        snapshot.metadata().attribution(),
                        snapshot.metadata().fetchedAt(),
                        true,
                        List.copyOf(warnings)
                )
        );
    }

    private BigDecimal average(List<BigDecimal> values) {
        List<BigDecimal> valid = values.stream().filter(Objects::nonNull).toList();
        if (valid.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = valid.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(valid.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal money(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal decimal(String value) {
        return new BigDecimal(value);
    }

    private String label(LocalDate date) {
        return date.format(LABEL_FORMAT).replace(".", "");
    }

    private void addWarning(List<String> warnings, String warning) {
        if (warning != null && !warning.isBlank() && !warnings.contains(warning)) {
            warnings.add(warning);
        }
    }

    private String safeMessage(RuntimeException exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }

    private record CommodityResult(
            MarketGrain grain,
            BigDecimal price,
            Instant updatedAt,
            String source,
            String warning
    ) {
    }
}
