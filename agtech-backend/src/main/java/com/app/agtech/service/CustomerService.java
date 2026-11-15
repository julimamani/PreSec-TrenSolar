package com.app.agtech.service;

import com.app.agtech.domain.entity.Customer;
import com.app.agtech.exception.ConflictException;
import com.app.agtech.exception.ResourceNotFoundException;
import com.app.agtech.repository.CustomerRepository;
import com.app.agtech.controller.dto.CustomerRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<Customer> findAll() {
        return customerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Customer findById(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    @Transactional
    public Customer create(CustomerRequest request) {
        ensureTaxIdAvailable(request.taxId(), null);

        Customer customer = Customer.builder()
                .businessName(request.businessName())
                .taxId(request.taxId())
                .subscriptionPlan(request.subscriptionPlan())
                .build();

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer update(UUID id, CustomerRequest request) {
        Customer customer = findById(id);
        ensureTaxIdAvailable(request.taxId(), id);

        customer.setBusinessName(request.businessName());
        customer.setTaxId(request.taxId());
        customer.setSubscriptionPlan(request.subscriptionPlan());

        return customerRepository.save(customer);
    }

    @Transactional
    public void delete(UUID id) {
        customerRepository.delete(findById(id));
    }

    private void ensureTaxIdAvailable(String taxId, UUID currentCustomerId) {
        customerRepository.findByTaxId(taxId).ifPresent(existing -> {
            if (currentCustomerId == null || !existing.getId().equals(currentCustomerId)) {
                throw new ConflictException("A customer already exists with taxId " + taxId);
            }
        });
    }
}
