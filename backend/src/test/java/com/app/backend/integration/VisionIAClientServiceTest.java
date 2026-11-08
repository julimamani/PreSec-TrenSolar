package com.app.backend.integration;

import com.app.backend.config.VisionAiProperties;
import com.app.backend.exception.VisionAiException;
import com.app.backend.integration.dto.VisionPredictionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class VisionIAClientServiceTest {

    private static final String BASE_URL = "http://localhost:8000";
    private static final String PREDICT_PATH = "/api/predict";

    @TempDir
    Path tempDirectory;

    private MockRestServiceServer mockServer;
    private VisionIAClientService visionIAClientService;
    private Path imagePath;

    @BeforeEach
    void setUp() throws Exception {
        VisionAiProperties properties = new VisionAiProperties(
                BASE_URL,
                PREDICT_PATH,
                Duration.ofSeconds(2),
                Duration.ofSeconds(5)
        );

        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        mockServer = MockRestServiceServer.bindTo(builder).build();
        visionIAClientService = new VisionIAClientService(builder.build(), properties);

        imagePath = tempDirectory.resolve("sample.jpg");
        Files.writeString(imagePath, "fake-image-content");
    }

    @Test
    void sendsStoredImageAsMultipartAndMapsPredictionResponse() {
        mockServer.expect(requestTo(BASE_URL + PREDICT_PATH))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.CONTENT_TYPE, containsString(MediaType.MULTIPART_FORM_DATA_VALUE)))
                .andExpect(content().string(containsString("fake-image-content")))
                .andRespond(withSuccess("""
                        {
                          "export_percentage": 92.4,
                          "discard_percentage": 7.6,
                          "defect_details": {
                            "broken": 3,
                            "discolored": 2
                          },
                          "heatmap_image_url": "/uploads/heatmap.jpg",
                          "ignored_field": "ignored"
                        }
                        """, MediaType.APPLICATION_JSON));

        VisionPredictionResponse response = visionIAClientService.predict(imagePath);

        assertEquals(92.4, response.exportPercentage(), 0.001);
        assertEquals(7.6, response.discardPercentage(), 0.001);
        assertEquals(3, ((Number) response.defectDetails().get("broken")).intValue());
        assertEquals("/uploads/heatmap.jpg", response.heatmapImageUrl());
        mockServer.verify();
    }

    @Test
    void wrapsUpstreamHttpErrors() {
        mockServer.expect(requestTo(BASE_URL + PREDICT_PATH))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        VisionAiException exception = assertThrows(
                VisionAiException.class,
                () -> visionIAClientService.predict(imagePath)
        );

        assertTrue(exception.getMessage().contains("500"));
        mockServer.verify();
    }

    @Test
    void rejectsMissingImageFile() {
        VisionAiException exception = assertThrows(
                VisionAiException.class,
                () -> visionIAClientService.predict(tempDirectory.resolve("missing.jpg"))
        );

        assertTrue(exception.getMessage().contains("not found"));
    }
}
