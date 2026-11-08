package com.app.backend.service;

import com.app.backend.domain.entity.InferenceResult;
import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.exception.ConflictException;
import com.app.backend.exception.ResourceNotFoundException;
import com.app.backend.repository.InferenceResultRepository;
import com.app.backend.repository.SampleAnalysisRepository;
import com.app.backend.web.dto.InferenceResultRequest;
import com.app.backend.web.dto.InferenceResultUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class InferenceResultService {

    private final InferenceResultRepository inferenceResultRepository;
    private final SampleAnalysisRepository sampleAnalysisRepository;

    public InferenceResultService(
            InferenceResultRepository inferenceResultRepository,
            SampleAnalysisRepository sampleAnalysisRepository
    ) {
        this.inferenceResultRepository = inferenceResultRepository;
        this.sampleAnalysisRepository = sampleAnalysisRepository;
    }

    @Transactional(readOnly = true)
    public List<InferenceResult> findAll() {
        return inferenceResultRepository.findAll();
    }

    @Transactional(readOnly = true)
    public InferenceResult findById(UUID id) {
        return inferenceResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("InferenceResult", id));
    }

    @Transactional(readOnly = true)
    public InferenceResult findBySampleAnalysisId(UUID sampleAnalysisId) {
        return inferenceResultRepository.findBySampleAnalysisId(sampleAnalysisId)
                .orElseThrow(() -> new ResourceNotFoundException("InferenceResult for SampleAnalysis", sampleAnalysisId));
    }

    @Transactional
    public InferenceResult create(InferenceResultRequest request) {
        SampleAnalysis sampleAnalysis = sampleAnalysisRepository.findById(request.sampleAnalysisId())
                .orElseThrow(() -> new ResourceNotFoundException("SampleAnalysis", request.sampleAnalysisId()));

        if (inferenceResultRepository.existsBySampleAnalysisId(request.sampleAnalysisId())) {
            throw new ConflictException("The sample analysis already has an inference result");
        }

        InferenceResult result = InferenceResult.builder()
                .sampleAnalysis(sampleAnalysis)
                .exportPercentage(request.exportPercentage())
                .discardPercentage(request.discardPercentage())
                .defectDetails(request.defectDetails())
                .heatmapImageUrl(request.heatmapImageUrl())
                .build();

        return inferenceResultRepository.save(result);
    }

    @Transactional
    public InferenceResult update(UUID id, InferenceResultUpdateRequest request) {
        InferenceResult result = findById(id);

        result.setExportPercentage(request.exportPercentage());
        result.setDiscardPercentage(request.discardPercentage());
        result.setDefectDetails(request.defectDetails());
        result.setHeatmapImageUrl(request.heatmapImageUrl());

        return inferenceResultRepository.save(result);
    }

    @Transactional
    public void delete(UUID id) {
        inferenceResultRepository.delete(findById(id));
    }
}
