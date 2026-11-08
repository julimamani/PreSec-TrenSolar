package com.app.backend.service;

import com.app.backend.domain.entity.Batch;
import com.app.backend.domain.entity.Customer;
import com.app.backend.exception.ResourceNotFoundException;
import com.app.backend.repository.BatchRepository;
import com.app.backend.repository.CustomerRepository;
import com.app.backend.web.dto.BatchRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final CustomerRepository customerRepository;

    public BatchService(BatchRepository batchRepository, CustomerRepository customerRepository) {
        this.batchRepository = batchRepository;
        this.customerRepository = customerRepository;
    }

    @Transactional(readOnly = true)
    public List<Batch> findAll(UUID customerId) {
        return customerId == null
                ? batchRepository.findAll()
                : batchRepository.findByCustomerId(customerId);
    }

    @Transactional(readOnly = true)
    public Batch findById(UUID id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch", id));
    }

    @Transactional
    public Batch create(BatchRequest request) {
        Customer customer = findCustomer(request.customerId());

        Batch batch = Batch.builder()
                .customer(customer)
                .variety(request.variety())
                .estimatedTons(request.estimatedTons())
                .build();

        return batchRepository.save(batch);
    }

    @Transactional
    public Batch update(UUID id, BatchRequest request) {
        Batch batch = findById(id);
        Customer customer = findCustomer(request.customerId());

        batch.setCustomer(customer);
        batch.setVariety(request.variety());
        batch.setEstimatedTons(request.estimatedTons());

        return batchRepository.save(batch);
    }

    @Transactional
    public void delete(UUID id) {
        batchRepository.delete(findById(id));
    }

    private Customer findCustomer(UUID customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
    }
}
