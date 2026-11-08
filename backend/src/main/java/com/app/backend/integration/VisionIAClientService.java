package com.app.backend.integration;

import com.app.backend.config.VisionAiProperties;
import com.app.backend.exception.VisionAiException;
import com.app.backend.integration.dto.VisionPredictionResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Outbound adapter for the Python/FastAPI computer-vision service.
 * It only handles HTTP communication; persistence belongs to the service layer.
 */
@Component
public class VisionIAClientService {

    private final RestClient restClient;
    private final VisionAiProperties properties;

    public VisionIAClientService(
            @Qualifier("visionAiRestClient") RestClient restClient,
            VisionAiProperties properties
    ) {
        this.restClient = restClient;
        this.properties = properties;
    }

    public VisionPredictionResponse predict(Path imagePath) {
        if (imagePath == null || !Files.isRegularFile(imagePath)) {
            throw new VisionAiException("Stored image was not found: " + imagePath);
        }

        MultipartBodyBuilder multipartBody = new MultipartBodyBuilder();
        multipartBody.part("file", new FileSystemResource(imagePath))
                .filename(imagePath.getFileName().toString());
        MultiValueMap<String, HttpEntity<?>> body = multipartBody.build();

        try {
            VisionPredictionResponse response = restClient.post()
                    .uri(properties.predictPath())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(VisionPredictionResponse.class);

            if (response == null) {
                throw new VisionAiException("Vision AI service returned an empty response");
            }
            return response;
        } catch (RestClientResponseException exception) {
            throw new VisionAiException(
                    "Vision AI service returned HTTP " + exception.getStatusCode().value(),
                    exception
            );
        } catch (ResourceAccessException exception) {
            throw new VisionAiException("Vision AI service is unavailable", exception);
        } catch (RestClientException exception) {
            throw new VisionAiException("Vision AI request could not be completed", exception);
        }
    }
}
