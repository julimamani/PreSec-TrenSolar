package com.app.agtech.controller.dto;

import com.app.agtech.domain.entity.Customer;
import com.app.agtech.domain.enums.SubscriptionPlan;

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
