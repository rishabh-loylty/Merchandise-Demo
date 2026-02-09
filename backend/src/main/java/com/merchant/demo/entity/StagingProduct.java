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
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "staging_products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StagingProduct {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "merchant_id", nullable = false)
    private Integer merchantId;

    @Column(name = "external_product_id")
    private String externalProductId;

    @Column(name = "raw_title")
    private String rawTitle;

    @Column(name = "raw_body_html", columnDefinition = "text")
    private String rawBodyHtml;

    @Column(name = "raw_vendor")
    private String rawVendor;

    @Column(name = "raw_product_type")
    private String rawProductType;
    
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "raw_tags", columnDefinition = "text[]")
    private List<String> rawTags = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_json_dump", columnDefinition = "jsonb")
    private String rawJsonDump;

    @Builder.Default
    private String status = "PENDING";

    @Column(name = "match_confidence_score")
    private Integer matchConfidenceScore;

    @Column(name = "admin_notes", columnDefinition = "text")
    private String adminNotes;

    @OneToMany(mappedBy = "stagingProduct", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<StagingVariant> variants = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_options_definition", columnDefinition = "jsonb")
    private String rawOptionsDefinition;
    
    // Helper to link variants back to the product
    public void addVariant(StagingVariant variant) {
        variants.add(variant);
        variant.setStagingProduct(this);
    }

    @OneToMany(mappedBy = "stagingProduct", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StagingMedia> media = new ArrayList<>();

    // Helper method
    public void addMedia(StagingMedia mediaItem) {
        media.add(mediaItem);
        mediaItem.setStagingProduct(this);
    }
}