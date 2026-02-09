package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VariantNode(
    String id,
    String sku,
    String barcode,
    String price,
    List<SelectedOption> selectedOptions
) {
    public record SelectedOption(String name, String value) {}
}
