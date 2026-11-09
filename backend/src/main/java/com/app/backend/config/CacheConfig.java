package com.app.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache configuration for the market agent.
 *
 * <p>The same cache entry protects the market snapshot (and therefore the FX
 * rate and all Matba Rofex quotes) from unnecessary external calls. The TTL
 * defaults to 15 minutes and can be increased with MARKET_CACHE_TTL.</p>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String MARKET_CACHE = "marketCache";

    @Bean
    public CacheManager cacheManager(MarketProperties properties) {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(MARKET_CACHE);
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(properties.cacheTtl())
                .maximumSize(20));
        return cacheManager;
    }
}
