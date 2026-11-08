package com.app.agtech.repository;

import com.app.agtech.domain.entity.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {

    List<Batch> findByCustomerId(UUID customerId);

    Page<Batch> findByCustomerId(UUID customerId, Pageable pageable);

    Optional<Batch> findByIdAndCustomerId(UUID id, UUID customerId);

    long countByCustomerId(UUID customerId);
}
