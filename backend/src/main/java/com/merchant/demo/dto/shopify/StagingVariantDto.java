package com.merchant.demo.dto.shopify;

// Use records for immutable DTOs
public record StagingVariantDto(String externalVariantId, String rawSku, String rawBarcode,
        java.math.BigDecimal rawPrice, String rawOptions) {
}