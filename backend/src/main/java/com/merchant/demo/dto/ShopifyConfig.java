package com.merchant.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

// Using a record for an immutable data carrier
public record ShopifyConfig(
    @JsonProperty("store_url") String storeUrl,
    @JsonProperty("access_token") String accessToken
) {}