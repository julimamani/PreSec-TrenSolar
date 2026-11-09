package com.app.backend.web;

import com.app.backend.service.FinancialAgentService;
import com.app.backend.web.dto.FinancialImpactRequest;
import com.app.backend.web.dto.FinancialImpactResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/financial")
public class FinancialController {

    private final FinancialAgentService financialAgentService;

    public FinancialController(FinancialAgentService financialAgentService) {
        this.financialAgentService = financialAgentService;
    }

    @PostMapping("/impact")
    public FinancialImpactResponse estimateImpact(@Valid @RequestBody FinancialImpactRequest request) {
        return financialAgentService.calculateImpact(request);
    }
}
