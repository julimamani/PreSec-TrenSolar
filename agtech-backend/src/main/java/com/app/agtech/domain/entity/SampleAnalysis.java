package com.app.agtech.domain.entity;

import com.app.agtech.domain.enums.AnalysisStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
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
import java.util.UUID;

@Entity
@Table(
        name = "sample_analyses",
        indexes = @Index(name = "idx_sample_analyses_batch_id", columnList = "batch_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class SampleAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @ToString.Include
    private UUID id;

    @Column(name = "original_image_url", nullable = false, length = 2048)
    private String originalImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AnalysisStatus status = AnalysisStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @OneToOne(mappedBy = "sampleAnalysis", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private InferenceResult inferenceResult;

    public void setInferenceResult(InferenceResult inferenceResult) {
        if (this.inferenceResult == inferenceResult) {
            return;
        }
        if (this.inferenceResult != null) {
            this.inferenceResult.setSampleAnalysis(null);
        }
        this.inferenceResult = inferenceResult;
        if (inferenceResult != null) {
            inferenceResult.setSampleAnalysis(this);
        }
    }
}
