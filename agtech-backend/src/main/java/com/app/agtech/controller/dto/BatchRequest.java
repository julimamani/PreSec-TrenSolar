package com.app.agtech.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BatchRequest(
        @NotNull UUID customerId,
        @Pattern(regexp = "(?i)poroto", message = "Only poroto is supported in this MVP")
        String grain,
        @NotBlank @Size(max = 100) String variety,
        @NotNull @Positive Double estimatedTons
) {
}
