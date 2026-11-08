package com.app.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(String location, String publicPath) {

    public StorageProperties {
        if (location == null || location.isBlank()) {
            location = "uploads";
        }
        if (publicPath == null || publicPath.isBlank()) {
            publicPath = "/uploads";
        }
        if (!publicPath.startsWith("/")) {
            publicPath = "/" + publicPath;
        }
        if (publicPath.endsWith("/")) {
            publicPath = publicPath.substring(0, publicPath.length() - 1);
        }
    }
}
