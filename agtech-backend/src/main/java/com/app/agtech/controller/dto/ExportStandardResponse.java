package com.app.agtech.web.dto;

import java.util.List;

public record ExportStandardResponse(
        String grain,
        String label,
        String norma,
        String scope,
        String source,
        List<ExportCriterionResponse> criteria,
        List<String> forbiddenConditions
) {
}
