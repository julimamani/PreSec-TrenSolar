package com.app.backend.repository;

import com.app.backend.domain.entity.Customer;
import com.app.backend.domain.enums.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    Optional<Customer> findByTaxId(String taxId);

    boolean existsByTaxId(String taxId);

    List<Customer> findBySubscriptionPlan(SubscriptionPlan subscriptionPlan);
}
