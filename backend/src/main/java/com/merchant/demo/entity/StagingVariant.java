package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "staging_variants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stagingProduct") // Avoid recursion in logs
public class StagingVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staging_product_id")
    private StagingProduct stagingProduct;

    @Column(name = "external_variant_id")
    private String externalVariantId;

    @Column(name = "raw_sku")
    private String rawSku;

    @Column(name = "raw_barcode")
    private String rawBarcode;

    @Column(name = "raw_price_minor")
    private Long rawPriceMinor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_options", columnDefinition = "jsonb")
    private String rawOptions;

    @Builder.Default
    private String status = "PENDING";

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}