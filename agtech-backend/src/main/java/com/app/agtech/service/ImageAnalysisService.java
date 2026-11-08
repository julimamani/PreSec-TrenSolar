package com.app.agtech.service;

import com.app.agtech.domain.entity.SampleAnalysis;
import com.app.agtech.integration.VisionIAClientService;
import com.app.agtech.integration.dto.VisionPredictionResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Orchestrates the complete image-analysis workflow. It keeps the external
 * Vision AI call outside the persistence transactions.
 */
@Service
public class ImageAnalysisService {

    private final FileStorageService fileStorageService;
    private final SampleAnalysisService sampleAnalysisService;
    private final VisionIAClientService visionIAClientService;

    public ImageAnalysisService(
            FileStorageService fileStorageService,
            SampleAnalysisService sampleAnalysisService,
            VisionIAClientService visionIAClientService
    ) {
        this.fileStorageService = fileStorageService;
        this.sampleAnalysisService = sampleAnalysisService;
        this.visionIAClientService = visionIAClientService;
    }

    public SampleAnalysis analyze(UUID batchId, MultipartFile file) {
        FileStorageService.StoredFile storedFile = fileStorageService.store(file);

        SampleAnalysis sampleAnalysis;
        try {
            sampleAnalysis = sampleAnalysisService.startProcessing(batchId, storedFile.url());
        } catch (RuntimeException exception) {
            deleteStoredFile(storedFile.filename(), exception);
            throw exception;
        }

        try {
            VisionPredictionResponse prediction = visionIAClientService.predict(storedFile.path());
            return sampleAnalysisService.complete(sampleAnalysis.getId(), prediction);
        } catch (RuntimeException exception) {
            try {
                sampleAnalysisService.markAsError(sampleAnalysis.getId());
            } catch (RuntimeException errorUpdateException) {
                exception.addSuppressed(errorUpdateException);
            }
            throw exception;
        }
    }

    private void deleteStoredFile(String filename, RuntimeException originalException) {
        try {
            fileStorageService.delete(filename);
        } catch (RuntimeException cleanupException) {
            originalException.addSuppressed(cleanupException);
        }
    }
}
