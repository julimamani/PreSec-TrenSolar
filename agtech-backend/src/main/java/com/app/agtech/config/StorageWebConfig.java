package com.app.agtech.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StorageWebConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    public StorageWebConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadDirectory = Paths.get(storageProperties.location())
                .toAbsolutePath()
                .normalize();

        String resourceLocation = uploadDirectory.toUri().toString();
        if (!resourceLocation.endsWith("/")) {
            resourceLocation = resourceLocation + "/";
        }

        registry.addResourceHandler(storageProperties.publicPath() + "/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(3600);
    }
}
