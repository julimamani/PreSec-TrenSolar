package com.app.backend.web.dto;

import com.app.backend.domain.entity.Customer;
import com.app.backend.domain.enums.SubscriptionPlan;

import java.time.Instant;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String businessName,
        String taxId,
        SubscriptionPlan subscriptionPlan,
        Instant createdAt,
        Instant updatedAt
) {

    public static CustomerResponse from(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getBusinessName(),
                customer.getTaxId(),
                customer.getSubscriptionPlan(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}
