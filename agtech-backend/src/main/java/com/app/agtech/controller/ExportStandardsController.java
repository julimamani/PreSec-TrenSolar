package com.app.agtech.web;

import com.app.agtech.service.ExportStandardsService;
import com.app.agtech.web.dto.ExportEvaluationRequest;
import com.app.agtech.web.dto.ExportEvaluationResponse;
import com.app.agtech.web.dto.ExportStandardResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/export-standards")
public class ExportStandardsController {

    private final ExportStandardsService exportStandardsService;

    public ExportStandardsController(ExportStandardsService exportStandardsService) {
        this.exportStandardsService = exportStandardsService;
    }

    @GetMapping
    public List<ExportStandardResponse> standards() {
        return exportStandardsService.standards();
    }

    @GetMapping("/{grain}")
    public ExportStandardResponse standard(@PathVariable String grain) {
        return exportStandardsService.standardFor(grain);
    }

    @PostMapping("/evaluate")
    public ExportEvaluationResponse evaluate(@Valid @RequestBody ExportEvaluationRequest request) {
        return exportStandardsService.evaluate(
                request.grain(),
                request.exportPercentage(),
                request.discardPercentage(),
                request.defectDetails()
        );
    }
}
