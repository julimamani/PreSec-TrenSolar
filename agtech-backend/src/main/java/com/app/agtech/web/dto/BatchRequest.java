package com.app.agtech.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BatchRequest(
        @NotNull UUID customerId,
        @NotBlank @Size(max = 100) String variety,
        @NotNull @Positive Double estimatedTons
) {
}
