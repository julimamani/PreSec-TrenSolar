package com.app.agtech.integration;

import com.app.agtech.config.RemarketsProperties;
import com.app.agtech.domain.enums.MarketGrain;
import com.app.agtech.exception.MarketDataException;
import com.app.agtech.integration.dto.MatbaRofexMarketDataResponse;
import com.app.agtech.integration.dto.MatbaRofexPrice;
import com.app.agtech.integration.dto.MatbaRofexQuote;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Outbound adapter for the Matba Rofex Primary API.
 *
 * <p>Authentication uses {@code POST /auth/getToken} with {@code X-Username}
 * and {@code X-Password}; the API returns the access token in the
 * {@code X-Auth-Token} response header. The token is cached for 24 hours by
 * default and every market-data request sends it back in the same header.</p>
 *
 * <p>Quotes are read from the Last Price ({@code LA}) entry of the configured
 * futures, falling back to the settlement price ({@code SE}) when the contract
 * has not traded yet. If the API is unavailable, authentication fails or a
 * contract has neither value, the market service applies the explicit
 * fallback.</p>
 */
@Component
public class MatbaRofexClient {

    private static final String AUTH_PATH = "/auth/getToken";
    private static final String MARKET_DATA_PATH = "/rest/marketdata/get";
    private static final String MARKET_ID = "ROFX";
    private static final String LAST_PRICE_ENTRY = "LA";
    private static final String SETTLEMENT_ENTRY = "SE";

    private final RestClient restClient;
    private final RemarketsProperties properties;
    private final ReentrantLock tokenLock = new ReentrantLock();

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public MatbaRofexClient(
            @Qualifier("marketRestClient") RestClient restClient,
            RemarketsProperties properties
    ) {
        this.restClient = restClient;
        this.properties = properties;
    }

    /**
     * Tries the configured futures for the grain in order and returns the first
     * valid last price. An empty result means the API answered but no contract
     * had a traded price; the service then uses its fallback.
     */
    public Optional<MatbaRofexQuote> fetchLastPrice(MarketGrain grain) {
        requireCredentials();

        List<String> symbols = properties.symbolsFor(grain);
        if (symbols.isEmpty()) {
            throw new MarketDataException(
                    "No Matba Rofex symbols are configured for " + grain.id()
            );
        }

        MarketDataException lastFailure = null;
        for (String symbol : symbols) {
            try {
                Optional<MatbaRofexQuote> quote = fetchLastPrice(symbol);
                if (quote.isPresent()) {
                    return quote;
                }
            } catch (MarketDataException exception) {
                lastFailure = exception;
            }
        }

        if (lastFailure != null) {
            throw lastFailure;
        }
        return Optional.empty();
    }

    /**
     * Reads the {@code LA} entry for a single instrument.
     */
    public Optional<MatbaRofexQuote> fetchLastPrice(String symbol) {
        requireCredentials();

        MatbaRofexMarketDataResponse response = getMarketData(symbol, true);
        if (response == null) {
            throw new MarketDataException("Matba Rofex returned an empty response for " + symbol);
        }
        if (response.status() == null || !"OK".equalsIgnoreCase(response.status())) {
            throw new MarketDataException(
                    "Matba Rofex returned status " + response.status() + " for " + symbol
            );
        }

        MatbaRofexPrice last = validPrice(response, LAST_PRICE_ENTRY);
        if (last == null) {
            // The demo environment often has no trades outside the session but
            // still publishes the settlement price. Use it before the generic
            // fallback so the dashboard keeps showing Matba Rofex data.
            last = validPrice(response, SETTLEMENT_ENTRY);
        }

        if (last == null) {
            return Optional.empty();
        }

        Instant timestamp = last.date() == null
                ? Instant.now()
                : Instant.ofEpochMilli(last.date());

        return Optional.of(new MatbaRofexQuote(symbol, last.price(), timestamp));
    }

    private MatbaRofexMarketDataResponse getMarketData(String symbol, boolean retryOnUnauthorized) {
        try {
            return restClient.get()
                    .uri(marketDataUri(symbol))
                    .header("X-Auth-Token", getToken())
                    .retrieve()
                    .body(MatbaRofexMarketDataResponse.class);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 401 && retryOnUnauthorized) {
                invalidateToken();
                return getMarketData(symbol, false);
            }
            throw new MarketDataException(
                    "Matba Rofex returned HTTP " + exception.getStatusCode().value()
                            + " for " + symbol,
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new MarketDataException("Matba Rofex is unavailable for " + symbol, exception);
        } catch (RestClientException exception) {
            throw new MarketDataException(
                    "The Matba Rofex request could not be completed for " + symbol,
                    exception
            );
        }
    }

    private String getToken() {
        String token = cachedToken;
        if (token != null && Instant.now().isBefore(tokenExpiresAt)) {
            return token;
        }

        tokenLock.lock();
        try {
            token = cachedToken;
            if (token != null && Instant.now().isBefore(tokenExpiresAt)) {
                return token;
            }

            String freshToken = login();
            cachedToken = freshToken;
            tokenExpiresAt = expirationFromNow();
            return freshToken;
        } finally {
            tokenLock.unlock();
        }
    }

    private String login() {
        try {
            ResponseEntity<Void> response = restClient.post()
                    .uri(uri(AUTH_PATH))
                    .header("X-Username", properties.user())
                    .header("X-Password", properties.password())
                    .retrieve()
                    .toBodilessEntity();

            String token = response.getHeaders().getFirst("X-Auth-Token");
            if (token == null || token.isBlank()) {
                throw new MarketDataException(
                        "Matba Rofex did not return an X-Auth-Token header"
                );
            }
            return token;
        } catch (RestClientResponseException exception) {
            throw new MarketDataException(
                    "Matba Rofex authentication failed with HTTP "
                            + exception.getStatusCode().value(),
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new MarketDataException("Matba Rofex authentication endpoint is unavailable", exception);
        } catch (RestClientException exception) {
            throw new MarketDataException("Matba Rofex authentication could not be completed", exception);
        }
    }

    private MatbaRofexPrice validPrice(MatbaRofexMarketDataResponse response, String entry) {
        if (response.marketData() == null) {
            return null;
        }
        MatbaRofexPrice price = response.marketData().get(entry);
        if (price == null || price.price() == null || price.price().signum() <= 0) {
            return null;
        }
        return price;
    }

    private void invalidateToken() {
        tokenLock.lock();
        try {
            cachedToken = null;
            tokenExpiresAt = Instant.EPOCH;
        } finally {
            tokenLock.unlock();
        }
    }

    private Instant expirationFromNow() {
        Duration ttl = properties.tokenTtl();
        Duration safetyMargin = ttl.compareTo(Duration.ofMinutes(2)) > 0
                ? Duration.ofMinutes(1)
                : Duration.ZERO;
        return Instant.now().plus(ttl).minus(safetyMargin);
    }

    private void requireCredentials() {
        if (!properties.credentialsConfigured()) {
            throw new MarketDataException(
                    "Matba Rofex credentials are not configured; set REMARKETS_USER and REMARKETS_PASSWORD"
            );
        }
    }

    private URI uri(String path) {
        String base = properties.baseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return URI.create(base + path);
    }

    private URI marketDataUri(String symbol) {
        String base = properties.baseUrl();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return UriComponentsBuilder.fromUriString(base)
                .path(MARKET_DATA_PATH)
                .queryParam("marketId", MARKET_ID)
                .queryParam("symbol", symbol)
                .queryParam("entries", LAST_PRICE_ENTRY + "," + SETTLEMENT_ENTRY)
                .queryParam("depth", "1")
                .build()
                .encode()
                .toUri();
    }
}
