package com.app.agtech.service;

import com.app.agtech.domain.entity.Batch;
import com.app.agtech.domain.entity.InferenceResult;
import com.app.agtech.domain.entity.SampleAnalysis;
import com.app.agtech.domain.enums.AnalysisStatus;
import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.exception.VisionAiException;
import com.app.agtech.integration.dto.VisionPredictionResponse;
import com.app.agtech.repository.BatchRepository;
import com.app.agtech.repository.SampleAnalysisRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class SampleAnalysisService {

    private final BatchRepository batchRepository;
    private final SampleAnalysisRepository sampleAnalysisRepository;

    public SampleAnalysisService(
            BatchRepository batchRepository,
            SampleAnalysisRepository sampleAnalysisRepository
    ) {
        this.batchRepository = batchRepository;
        this.sampleAnalysisRepository = sampleAnalysisRepository;
    }

    @Transactional
    public SampleAnalysis startProcessing(UUID batchId, String imageUrl) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Batch", batchId));

        SampleAnalysis sampleAnalysis = SampleAnalysis.builder()
                .originalImageUrl(imageUrl)
                .status(AnalysisStatus.PROCESSING)
                .build();

        batch.addSampleAnalysis(sampleAnalysis);
        return sampleAnalysisRepository.saveAndFlush(sampleAnalysis);
    }

    @Transactional
    public SampleAnalysis complete(UUID sampleAnalysisId, VisionPredictionResponse prediction) {
        validatePrediction(prediction);

        SampleAnalysis sampleAnalysis = sampleAnalysisRepository.findById(sampleAnalysisId)
                .orElseThrow(() -> new ResourceNotFoundException("SampleAnalysis", sampleAnalysisId));

        Map<String, Object> defectDetails = prediction.defectDetails() == null
                ? Map.of()
                : prediction.defectDetails();

        InferenceResult inferenceResult = InferenceResult.builder()
                .exportPercentage(prediction.exportPercentage())
                .discardPercentage(prediction.discardPercentage())
                .defectDetails(defectDetails)
                .heatmapImageUrl(prediction.heatmapImageUrl())
                .build();

        sampleAnalysis.setInferenceResult(inferenceResult);
        sampleAnalysis.setStatus(AnalysisStatus.COMPLETED);
        return sampleAnalysisRepository.save(sampleAnalysis);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markAsError(UUID sampleAnalysisId) {
        sampleAnalysisRepository.findById(sampleAnalysisId).ifPresent(sampleAnalysis -> {
            sampleAnalysis.setStatus(AnalysisStatus.ERROR);
            sampleAnalysisRepository.save(sampleAnalysis);
        });
    }

    private void validatePrediction(VisionPredictionResponse prediction) {
        if (prediction == null
                || prediction.exportPercentage() == null
                || prediction.discardPercentage() == null
                || prediction.heatmapImageUrl() == null
                || prediction.heatmapImageUrl().isBlank()) {
            throw new VisionAiException("Vision AI response is missing required quality data");
        }
    }
}
