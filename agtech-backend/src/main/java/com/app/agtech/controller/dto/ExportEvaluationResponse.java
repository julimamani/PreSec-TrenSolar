package com.app.agtech.web.dto;

import java.time.Instant;
import java.util.List;

public record ExportEvaluationResponse(
        String grain,
        boolean exportable,
        Double exportPercentage,
        Double discardPercentage,
        List<ExportCriterionCheckResponse> checks,
        List<String> violations,
        List<String> unmappedDefects,
        String norma,
        Instant evaluatedAt
) {
}
