package com.app.backend.web;

import com.app.backend.domain.entity.SampleAnalysis;
import com.app.backend.service.ImageAnalysisService;
import com.app.backend.web.dto.SampleAnalysisResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/sample-analyses")
public class SampleAnalysisController {

    private final ImageAnalysisService imageAnalysisService;

    public SampleAnalysisController(ImageAnalysisService imageAnalysisService) {
        this.imageAnalysisService = imageAnalysisService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public SampleAnalysisResponse analyzeSample(
            @RequestParam UUID batchId,
            @RequestPart("file") MultipartFile file
    ) {
        SampleAnalysis sampleAnalysis = imageAnalysisService.analyze(batchId, file);
        return SampleAnalysisResponse.from(sampleAnalysis, batchId);
    }
}
