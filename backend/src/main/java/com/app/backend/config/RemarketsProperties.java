package com.app.backend.config;

import com.app.backend.domain.enums.MarketGrain;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Credentials and instrument selection for the Matba Rofex Primary API.
 *
 * <p>The account is not used for public market-data calls, but it is kept in the
 * configuration because it is part of the credentials delivered to reMarkets
 * and will be needed if order routing is added later.</p>
 */
@ConfigurationProperties(prefix = "api.remarkets")
public record RemarketsProperties(
        String baseUrl,
        String user,
        String password,
        String account,
        Duration tokenTtl,
        Map<String, String> symbols
) {

    public RemarketsProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "https://api.remarkets.primary.com.ar";
        }
        if (tokenTtl == null || tokenTtl.isNegative() || tokenTtl.isZero()) {
            tokenTtl = Duration.ofHours(24);
        }
        if (symbols == null) {
            symbols = Map.of();
        }
    }

    /**
     * Ordered list of futures to try for a grain. The first instrument that
     * returns a valid last price wins; if none does, the market service applies
     * the configured fallback.
     */
    public List<String> symbolsFor(MarketGrain grain) {
        String raw = symbols.get(grain.id());
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(symbol -> !symbol.isBlank())
                .toList();
    }

    public boolean credentialsConfigured() {
        return user != null && !user.isBlank()
                && password != null && !password.isBlank();
    }
}
