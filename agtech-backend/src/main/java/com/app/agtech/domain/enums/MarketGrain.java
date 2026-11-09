package com.app.agtech.domain.enums;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

/**
 * Grains supported by the PuroGrano market agent.
 *
 * <p>Soybean, corn and wheat are quoted through Matba Rofex agricultural
 * futures. Bean (poroto) has no futures contract there, so the market service
 * resolves it from a configurable regional spot price.</p>
 */
public enum MarketGrain {

    SOJA("soja", "Soja", true),
    MAIZ("maiz", "Maíz", true),
    TRIGO("trigo", "Trigo", true),
    POROTO("poroto", "Poroto", false);

    private final String id;
    private final String label;
    private final boolean remarketsFuture;

    MarketGrain(String id, String label, boolean remarketsFuture) {
        this.id = id;
        this.label = label;
        this.remarketsFuture = remarketsFuture;
    }

    public String id() {
        return id;
    }

    public String label() {
        return label;
    }

    public boolean remarketsFuture() {
        return remarketsFuture;
    }

    public static Optional<MarketGrain> find(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(grain -> grain.id.equals(normalized))
                .findFirst();
    }

    public static MarketGrain fromId(String value) {
        return find(value)
                .orElseThrow(() -> new IllegalArgumentException("Unsupported grain: " + value));
    }
}
