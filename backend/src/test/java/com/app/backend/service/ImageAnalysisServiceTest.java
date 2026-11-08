package com.app.backend.service;

import com.app.backend.domain.entity.Batch;
import com.app.backend.domain.entity.Customer;
import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.domain.enums.AnalysisStatus;
import com.app.backend.domain.enums.SubscriptionPlan;
import com.app.backend.integration.VisionIAClientService;
import com.app.backend.integration.dto.VisionPredictionResponse;
import com.app.backend.repository.CustomerRepository;
import com.app.backend.repository.SampleAnalysisRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@Transactional
class ImageAnalysisServiceTest {

    @Autowired
    private ImageAnalysisService imageAnalysisService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SampleAnalysisRepository sampleAnalysisRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @MockitoBean
    private VisionIAClientService visionIAClientService;

    @Test
    void storesImagePersistsProcessingStateAndCompletesWithInferenceResult() {
        Customer customer = Customer.builder()
                .businessName("TrenSolar Grains")
                .taxId("30-" + UUID.randomUUID())
                .subscriptionPlan(SubscriptionPlan.BASIC)
                .build();

        Batch batch = Batch.builder()
                .variety("Alubia Cargamanto")
                .estimatedTons(10.0)
                .build();

        customer.addBatch(batch);
        customerRepository.saveAndFlush(customer);

        when(visionIAClientService.predict(any(Path.class))).thenReturn(new VisionPredictionResponse(
                92.4,
                7.6,
                Map.of("broken", 3, "discolored", 2),
                "/uploads/heatmap.jpg"
        ));

        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        SampleAnalysis completed = imageAnalysisService.analyze(batch.getId(), image);
        String storedFilename = Path.of(completed.getOriginalImageUrl()).getFileName().toString();

        assertEquals(AnalysisStatus.COMPLETED, completed.getStatus());
        assertTrue(completed.getOriginalImageUrl().startsWith("/uploads/"));
        assertEquals(92.4, completed.getInferenceResult().getExportPercentage());
        assertEquals(7.6, completed.getInferenceResult().getDiscardPercentage());
        assertEquals(3, ((Number) completed.getInferenceResult().getDefectDetails().get("broken")).intValue());
        assertEquals("/uploads/heatmap.jpg", completed.getInferenceResult().getHeatmapImageUrl());
        assertTrue(Files.exists(fileStorageService.getRootLocation().resolve(storedFilename)));

        SampleAnalysis persisted = sampleAnalysisRepository.findById(completed.getId()).orElseThrow();
        assertEquals(AnalysisStatus.COMPLETED, persisted.getStatus());
        assertNotNull(persisted.getInferenceResult());
        assertEquals(batch.getId(), persisted.getBatch().getId());

        fileStorageService.delete(storedFilename);
    }
}
