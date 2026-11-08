package com.app.agtech.domain.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "batches",
        indexes = @Index(name = "idx_batches_customer_id", columnList = "customer_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @ToString.Include
    private UUID id;

    @Column(name = "variety", nullable = false, length = 100)
    private String variety;

    @Column(name = "estimated_tons", nullable = false)
    private Double estimatedTons;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SampleAnalysis> sampleAnalyses = new ArrayList<>();

    public void addSampleAnalysis(SampleAnalysis sampleAnalysis) {
        if (sampleAnalysis == null || sampleAnalyses.contains(sampleAnalysis)) {
            return;
        }
        sampleAnalyses.add(sampleAnalysis);
        sampleAnalysis.setBatch(this);
    }

    public void removeSampleAnalysis(SampleAnalysis sampleAnalysis) {
        if (sampleAnalysis == null) {
            return;
        }
        sampleAnalyses.remove(sampleAnalysis);
        sampleAnalysis.setBatch(null);
    }
}
