package com.app.agtech.domain.entity;

import com.app.agtech.domain.enums.SubscriptionPlan;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
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
        name = "customers",
        uniqueConstraints = @UniqueConstraint(name = "uk_customers_tax_id", columnNames = "tax_id")
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(onlyExplicitlyIncluded = true)
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    @ToString.Include
    private UUID id;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Column(name = "tax_id", nullable = false, length = 50)
    private String taxId;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan", nullable = false, length = 20)
    private SubscriptionPlan subscriptionPlan;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Batch> batches = new ArrayList<>();

    public void addBatch(Batch batch) {
        if (batch == null || batches.contains(batch)) {
            return;
        }
        batches.add(batch);
        batch.setCustomer(this);
    }

    public void removeBatch(Batch batch) {
        if (batch == null) {
            return;
        }
        batches.remove(batch);
        batch.setCustomer(null);
    }
}
