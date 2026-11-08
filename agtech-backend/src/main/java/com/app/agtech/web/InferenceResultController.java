package com.app.agtech.web;

import com.app.agtech.domain.entity.InferenceResult;
import com.app.agtech.service.InferenceResultService;
import com.app.agtech.web.dto.InferenceResultDetailResponse;
import com.app.agtech.web.dto.InferenceResultRequest;
import com.app.agtech.web.dto.InferenceResultUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inference-results")
public class InferenceResultController {

    private final InferenceResultService inferenceResultService;

    public InferenceResultController(InferenceResultService inferenceResultService) {
        this.inferenceResultService = inferenceResultService;
    }

    @GetMapping
    public List<InferenceResultDetailResponse> findAll() {
        return inferenceResultService.findAll().stream()
                .map(InferenceResultDetailResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public InferenceResultDetailResponse findById(@PathVariable UUID id) {
        return InferenceResultDetailResponse.from(inferenceResultService.findById(id));
    }

    @GetMapping("/by-sample-analysis/{sampleAnalysisId}")
    public InferenceResultDetailResponse findBySampleAnalysisId(@PathVariable UUID sampleAnalysisId) {
        return InferenceResultDetailResponse.from(
                inferenceResultService.findBySampleAnalysisId(sampleAnalysisId)
        );
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InferenceResultDetailResponse create(@Valid @RequestBody InferenceResultRequest request) {
        InferenceResult result = inferenceResultService.create(request);
        return InferenceResultDetailResponse.from(result);
    }

    @PutMapping("/{id}")
    public InferenceResultDetailResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody InferenceResultUpdateRequest request
    ) {
        InferenceResult result = inferenceResultService.update(id, request);
        return InferenceResultDetailResponse.from(result);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        inferenceResultService.delete(id);
    }
}
