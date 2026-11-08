package com.app.backend.web;

import com.app.backend.domain.entity.InferenceResult;
import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.domain.enums.AnalysisStatus;
import com.app.backend.service.ImageAnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SampleAnalysisControllerTest {

    @Test
    void acceptsMultipartUploadAndReturnsCompletedAnalysis() throws Exception {
        ImageAnalysisService imageAnalysisService = mock(ImageAnalysisService.class);
        UUID batchId = UUID.randomUUID();
        UUID analysisId = UUID.randomUUID();
        UUID resultId = UUID.randomUUID();

        InferenceResult inferenceResult = InferenceResult.builder()
                .id(resultId)
                .exportPercentage(92.4)
                .discardPercentage(7.6)
                .defectDetails(Map.of("broken", 3))
                .heatmapImageUrl("/uploads/heatmap.jpg")
                .build();

        SampleAnalysis sampleAnalysis = SampleAnalysis.builder()
                .id(analysisId)
                .originalImageUrl("/uploads/sample.jpg")
                .status(AnalysisStatus.COMPLETED)
                .createdAt(Instant.now())
                .build();
        sampleAnalysis.setInferenceResult(inferenceResult);

        when(imageAnalysisService.analyze(any(UUID.class), any())).thenReturn(sampleAnalysis);

        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(new SampleAnalysisController(imageAnalysisService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();

        MockMultipartFile image = new MockMultipartFile(
                "file",
                "sample.jpg",
                "image/jpeg",
                "fake-image-content".getBytes()
        );

        mockMvc.perform(multipart("/api/sample-analyses")
                        .file(image)
                        .param("batchId", batchId.toString()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(analysisId.toString()))
                .andExpect(jsonPath("$.batchId").value(batchId.toString()))
                .andExpect(jsonPath("$.originalImageUrl").value("/uploads/sample.jpg"))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.inferenceResult.id").value(resultId.toString()))
                .andExpect(jsonPath("$.inferenceResult.exportPercentage").value(92.4))
                .andExpect(jsonPath("$.inferenceResult.discardPercentage").value(7.6))
                .andExpect(jsonPath("$.inferenceResult.heatmapImageUrl").value("/uploads/heatmap.jpg"));
    }
}
