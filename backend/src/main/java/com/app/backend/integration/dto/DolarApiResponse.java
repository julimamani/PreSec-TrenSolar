package com.app.backend.integration.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DolarApiResponse(
        String moneda,
        String casa,
        String nombre,
        BigDecimal compra,
        BigDecimal venta,
        String fechaActualizacion
) {
}
