package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductConnection(List<ProductEdge> edges, PageInfo pageInfo) {
    public record ProductEdge(ProductNode node) {}
    public record PageInfo(boolean hasNextPage, String endCursor) {}
}
