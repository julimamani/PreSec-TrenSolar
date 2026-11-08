package com.app.agtech.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.vision-ai")
public record VisionAiProperties(
        String baseUrl,
        String predictPath,
        Duration connectTimeout,
        Duration readTimeout
) {

    public VisionAiProperties {
        if (baseUrl == null || baseUrl.isBlank()) {
            baseUrl = "http://localhost:8000";
        }
        if (predictPath == null || predictPath.isBlank()) {
            predictPath = "/api/predict";
        } else if (!predictPath.startsWith("/")) {
            predictPath = "/" + predictPath;
        }
        if (connectTimeout == null) {
            connectTimeout = Duration.ofSeconds(2);
        }
        if (readTimeout == null) {
            readTimeout = Duration.ofSeconds(30);
        }
    }
}
