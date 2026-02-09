package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "merchant_offers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantOffer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "merchant_id", nullable = false)
    private Integer merchantId;

    @Column(name = "variant_id", nullable = false)
    private Integer variantId;

    @Column(name = "external_product_id")
    private String externalProductId;

    @Column(name = "external_variant_id")
    private String externalVariantId;

    @Column(name = "merchant_sku")
    private String merchantSku;

    @Column(name = "currency_code", nullable = false)
    private String currencyCode;

    @Column(name = "cached_price_minor", nullable = false)
    private Long cachedPriceMinor;

    @Column(name = "cached_settlement_price_minor", nullable = false)
    private Long cachedSettlementPriceMinor;

    @Column(name = "current_stock")
    private Integer currentStock;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "offer_status")
    private String offerStatus;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
