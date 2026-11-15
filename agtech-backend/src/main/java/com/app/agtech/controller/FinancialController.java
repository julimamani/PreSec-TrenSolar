package com.app.agtech.controller;

import com.app.agtech.service.FinancialAgentService;
import com.app.agtech.controller.dto.FinancialImpactRequest;
import com.app.agtech.controller.dto.FinancialImpactResponse;
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
