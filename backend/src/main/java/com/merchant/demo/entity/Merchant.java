package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;


import java.time.Instant;

@Entity
@Table(name = "merchants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Merchant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    private String email;

    @Column(name = "source_type", nullable = false)
    @Builder.Default
    private String sourceType = "SHOPIFY";

    // Mapping JSONB as String for simplicity in this iteration
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "source_config", columnDefinition = "jsonb", nullable = false)
    @Builder.Default
    private String sourceConfig = "{}";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "shopify_configured", nullable = false)
    @Builder.Default
    private Boolean shopifyConfigured = false;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
