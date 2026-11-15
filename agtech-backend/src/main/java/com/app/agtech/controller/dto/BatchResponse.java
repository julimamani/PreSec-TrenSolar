package com.app.agtech.controller.dto;

import com.app.agtech.domain.entity.Batch;

import java.time.Instant;
import java.util.UUID;

public record BatchResponse(
        UUID id,
        UUID customerId,
        String grain,
        String variety,
        Double estimatedTons,
        Instant createdAt,
        Instant updatedAt
) {

    public static BatchResponse from(Batch batch) {
        return new BatchResponse(
                batch.getId(),
                batch.getCustomer().getId(),
                batch.getGrain().id(),
                batch.getVariety(),
                batch.getEstimatedTons(),
                batch.getCreatedAt(),
                batch.getUpdatedAt()
        );
    }
}
