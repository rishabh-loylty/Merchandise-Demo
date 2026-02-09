package com.merchant.demo.dto.shopify;

import java.util.List;

public record StagingProductDto(String externalProductId, String rawTitle, String rawVendor,
        List<StagingVariantDto> variants) {
}