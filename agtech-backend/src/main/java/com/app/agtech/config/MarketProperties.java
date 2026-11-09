package com.app.agtech.config;

import com.app.agtech.domain.enums.MarketGrain;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;
import java.time.Duration;

/**
 * Configuration for the hybrid market agent.
 *
 * <p>Matba Rofex supplies the local last price for soybean, corn and wheat.
 * Bean is resolved from {@link #porotoSpotUsd()}. The explicit fallback prices
 * keep the demo working when reMarkets is unavailable, credentials have not
 * been configured yet or a contract has no traded price.</p>
 */
@ConfigurationProperties(prefix = "app.market")
public record MarketProperties(
        int seriesLimit,
        Duration cacheTtl,
        Duration connectTimeout,
        Duration readTimeout,
        String provider,
        String attribution,
        BigDecimal qualityPremiumRate,
        BigDecimal porotoSpotUsd,
        BigDecimal sojaFallbackUsd,
        BigDecimal maizFallbackUsd,
        BigDecimal trigoFallbackUsd,
        BigDecimal usdArsFallback
) {

    public MarketProperties {
        if (seriesLimit < 1) {
            seriesLimit = 90;
        }
        if (seriesLimit > 365) {
            seriesLimit = 365;
        }
        if (cacheTtl == null || cacheTtl.isNegative() || cacheTtl.isZero()) {
            cacheTtl = Duration.ofMinutes(15);
        }
        if (connectTimeout == null) {
            connectTimeout = Duration.ofSeconds(3);
        }
        if (readTimeout == null) {
            readTimeout = Duration.ofSeconds(12);
        }
        if (provider == null || provider.isBlank()) {
            provider = "Matba Rofex + DolarAPI";
        }
        if (attribution == null || attribution.isBlank()) {
            attribution = "Commodities: Matba Rofex · Tipo de cambio: DolarAPI · Poroto: spot regional";
        }
        if (qualityPremiumRate == null || qualityPremiumRate.signum() < 0) {
            qualityPremiumRate = new BigDecimal("0.04");
        }
        if (porotoSpotUsd == null || porotoSpotUsd.signum() <= 0) {
            porotoSpotUsd = new BigDecimal("1250");
        }
        if (sojaFallbackUsd == null || sojaFallbackUsd.signum() <= 0) {
            sojaFallbackUsd = new BigDecimal("450");
        }
        if (maizFallbackUsd == null || maizFallbackUsd.signum() <= 0) {
            maizFallbackUsd = new BigDecimal("200");
        }
        if (trigoFallbackUsd == null || trigoFallbackUsd.signum() <= 0) {
            trigoFallbackUsd = new BigDecimal("220");
        }
        if (usdArsFallback == null || usdArsFallback.signum() <= 0) {
            usdArsFallback = new BigDecimal("1500");
        }
    }

    public BigDecimal fallbackFor(MarketGrain grain) {
        return switch (grain) {
            case SOJA -> sojaFallbackUsd;
            case MAIZ -> maizFallbackUsd;
            case TRIGO -> trigoFallbackUsd;
            case POROTO -> porotoSpotUsd;
        };
    }
}
