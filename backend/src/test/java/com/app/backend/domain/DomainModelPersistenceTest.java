package com.app.backend.domain;

import com.app.backend.domain.entity.Batch;
import com.app.backend.domain.entity.Customer;
import com.app.backend.domain.entity.InferenceResult;
import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.domain.enums.AnalysisStatus;
import com.app.backend.domain.enums.SubscriptionPlan;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@Transactional
class DomainModelPersistenceTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    void persistsFullAnalysisAggregateAndSerializesDefectDetailsAsJson() {
        Customer customer = Customer.builder()
                .businessName("TrenSolar Grains")
                .taxId("30-12345678-9")
                .subscriptionPlan(SubscriptionPlan.PRO)
                .build();

        Batch batch = Batch.builder()
                .variety("Alubia Cargamanto")
                .estimatedTons(25.5)
                .build();

        SampleAnalysis analysis = SampleAnalysis.builder()
                .originalImageUrl("https://storage.example.com/samples/original.jpg")
                .status(AnalysisStatus.COMPLETED)
                .build();

        InferenceResult result = InferenceResult.builder()
                .exportPercentage(92.4)
                .discardPercentage(7.6)
                .defectDetails(Map.of(
                        "broken", 3,
                        "discolored", 2,
                        "foreignMatter", 1
                ))
                .heatmapImageUrl("https://storage.example.com/samples/heatmap.jpg")
                .build();

        customer.addBatch(batch);
        batch.addSampleAnalysis(analysis);
        analysis.setInferenceResult(result);

        entityManager.persist(customer);
        entityManager.flush();
        entityManager.clear();

        Customer stored = entityManager.find(Customer.class, customer.getId());

        assertNotNull(stored);
        assertNotNull(stored.getCreatedAt());
        assertNotNull(stored.getUpdatedAt());
        assertEquals(1, stored.getBatches().size());

        InferenceResult storedResult = stored.getBatches().get(0)
                .getSampleAnalyses().get(0)
                .getInferenceResult();

        assertEquals(92.4, storedResult.getExportPercentage());
        assertEquals(List.of("broken", "discolored", "foreignMatter"),
                storedResult.getDefectDetails().keySet().stream().sorted().toList());
    }
}
