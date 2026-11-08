package com.app.agtech.web;

import com.app.agtech.domain.entity.Batch;
import com.app.agtech.service.BatchService;
import com.app.agtech.web.dto.BatchRequest;
import com.app.agtech.web.dto.BatchResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping
    public List<BatchResponse> findAll(@RequestParam(required = false) UUID customerId) {
        return batchService.findAll(customerId).stream()
                .map(BatchResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public BatchResponse findById(@PathVariable UUID id) {
        return BatchResponse.from(batchService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BatchResponse create(@Valid @RequestBody BatchRequest request) {
        Batch batch = batchService.create(request);
        return BatchResponse.from(batch);
    }

    @PutMapping("/{id}")
    public BatchResponse update(@PathVariable UUID id, @Valid @RequestBody BatchRequest request) {
        Batch batch = batchService.update(id, request);
        return BatchResponse.from(batch);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        batchService.delete(id);
    }
}
