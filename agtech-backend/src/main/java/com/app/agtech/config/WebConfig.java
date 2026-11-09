package com.app.agtech.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Allows the Vite dev server to call the API and read uploaded images.
 * Origins are configurable so the same build can be deployed elsewhere.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String[] allowedOriginPatterns;

    public WebConfig(
            @Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
            String allowedOrigins
    ) {
        this.allowedOriginPatterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);

        registry.addMapping("/uploads/**")
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .maxAge(3600);
    }
}
