package com.app.agtech.service;

import com.app.agtech.domain.entity.SampleAnalysis;
import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.exception.VisionAiException;
import com.app.agtech.integration.VisionIAClientService;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageAnalysisServiceFailureTest {

    private final FileStorageService fileStorageService = mock(FileStorageService.class);
    private final SampleAnalysisService sampleAnalysisService = mock(SampleAnalysisService.class);
    private final VisionIAClientService visionIAClientService = mock(VisionIAClientService.class);
    private final ImageAnalysisService imageAnalysisService = new ImageAnalysisService(
            fileStorageService,
            sampleAnalysisService,
            visionIAClientService
    );

    @Test
    void marksSampleAsErrorWhenVisionAiFails() {
        UUID batchId = UUID.randomUUID();
        UUID sampleAnalysisId = UUID.randomUUID();
        MultipartFile file = mock(MultipartFile.class);
        FileStorageService.StoredFile storedFile = storedFile();
        SampleAnalysis sampleAnalysis = SampleAnalysis.builder()
                .id(sampleAnalysisId)
                .build();

        when(fileStorageService.store(file)).thenReturn(storedFile);
        when(sampleAnalysisService.startProcessing(batchId, storedFile.url())).thenReturn(sampleAnalysis);
        when(visionIAClientService.predict(storedFile.path()))
                .thenThrow(new VisionAiException("Vision AI is down"));

        assertThrows(VisionAiException.class, () -> imageAnalysisService.analyze(batchId, file));

        verify(sampleAnalysisService).markAsError(sampleAnalysisId);
        verify(fileStorageService, never()).delete(anyString());
    }

    @Test
    void deletesStoredFileWhenSampleAnalysisCannotBeCreated() {
        UUID batchId = UUID.randomUUID();
        MultipartFile file = mock(MultipartFile.class);
        FileStorageService.StoredFile storedFile = storedFile();

        when(fileStorageService.store(file)).thenReturn(storedFile);
        when(sampleAnalysisService.startProcessing(batchId, storedFile.url()))
                .thenThrow(new ResourceNotFoundException("Batch", batchId));

        assertThrows(
                ResourceNotFoundException.class,
                () -> imageAnalysisService.analyze(batchId, file)
        );

        verify(fileStorageService).delete(storedFile.filename());
    }

    private FileStorageService.StoredFile storedFile() {
        return new FileStorageService.StoredFile(
                "stored.jpg",
                Path.of("/tmp/stored.jpg"),
                "/uploads/stored.jpg",
                "image/jpeg",
                10L
        );
    }
}
