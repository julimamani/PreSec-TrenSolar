package com.app.backend.web.dto;

import com.app.backend.domain.enums.SubscriptionPlan;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
        @NotBlank @Size(max = 150) String businessName,
        @NotBlank @Size(max = 50) String taxId,
        @NotNull SubscriptionPlan subscriptionPlan
) {
}
