package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

// Root response
@JsonIgnoreProperties(ignoreUnknown = true)
public record ShopifyProductResponse(DataWrapper data, Errors[] errors) {
    public record DataWrapper(ProductConnection products) {}
    public record Errors(String message) {}
}
