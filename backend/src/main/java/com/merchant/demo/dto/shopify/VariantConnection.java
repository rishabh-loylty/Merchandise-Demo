package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record VariantConnection(List<VariantEdge> edges) {
    public record VariantEdge(VariantNode node) {}
}
