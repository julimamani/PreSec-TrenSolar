package com.app.backend.web;

import com.app.backend.domain.entity.Batch;
import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.domain.enums.AnalysisStatus;
import com.app.backend.repository.BatchRepository;
import com.app.backend.repository.SampleAnalysisRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CrudControllersIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private SampleAnalysisRepository sampleAnalysisRepository;

    @Test
    void performsCrudAcrossCustomerBatchAndInferenceResult() throws Exception {
        MvcResult customerResult = mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "businessName": "Acopio Central",
                                  "taxId": "TAX-001",
                                  "subscriptionPlan": "PRO"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.businessName").value("Acopio Central"))
                .andExpect(jsonPath("$.subscriptionPlan").value("PRO"))
                .andReturn();

        String customerId = JsonPath.parse(customerResult.getResponse().getContentAsString())
                .read("$.id", String.class);

        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "businessName": "Duplicate",
                                  "taxId": "TAX-001",
                                  "subscriptionPlan": "BASIC"
                                }
                                """))
                .andExpect(status().isConflict());

        MvcResult batchResult = mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customerId": "%s",
                                  "variety": "Alubia Cargamanto",
                                  "estimatedTons": 12.5
                                }
                                """.formatted(customerId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerId").value(customerId))
                .andReturn();

        String batchId = JsonPath.parse(batchResult.getResponse().getContentAsString())
                .read("$.id", String.class);

        mockMvc.perform(get("/api/batches").param("customerId", customerId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(batchId));

        Batch batch = batchRepository.findById(UUID.fromString(batchId)).orElseThrow();
        SampleAnalysis sampleAnalysis = SampleAnalysis.builder()
                .originalImageUrl("/uploads/sample.jpg")
                .status(AnalysisStatus.PENDING)
                .build();
        batch.addSampleAnalysis(sampleAnalysis);
        sampleAnalysisRepository.saveAndFlush(sampleAnalysis);

        MvcResult inferenceResult = mockMvc.perform(post("/api/inference-results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sampleAnalysisId": "%s",
                                  "exportPercentage": 90.0,
                                  "discardPercentage": 10.0,
                                  "defectDetails": {
                                    "broken": 2
                                  },
                                  "heatmapImageUrl": "/uploads/heatmap.jpg"
                                }
                                """.formatted(sampleAnalysis.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sampleAnalysisId").value(sampleAnalysis.getId().toString()))
                .andExpect(jsonPath("$.exportPercentage").value(90.0))
                .andReturn();

        String inferenceResultId = JsonPath.parse(inferenceResult.getResponse().getContentAsString())
                .read("$.id", String.class);

        mockMvc.perform(get("/api/inference-results/by-sample-analysis/{id}", sampleAnalysis.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(inferenceResultId));

        mockMvc.perform(put("/api/inference-results/{id}", inferenceResultId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "exportPercentage": 95.0,
                                  "discardPercentage": 5.0,
                                  "defectDetails": {
                                    "broken": 1
                                  },
                                  "heatmapImageUrl": "/uploads/heatmap-updated.jpg"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.exportPercentage").value(95.0))
                .andExpect(jsonPath("$.heatmapImageUrl").value("/uploads/heatmap-updated.jpg"));

        mockMvc.perform(delete("/api/inference-results/{id}", inferenceResultId))
                .andExpect(status().isNoContent());
    }

    @Test
    void returnsValidationErrorsForInvalidCustomer() throws Exception {
        mockMvc.perform(post("/api/customers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "businessName": "",
                                  "subscriptionPlan": "PRO"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.businessName").exists())
                .andExpect(jsonPath("$.errors.taxId").exists());
    }
}
