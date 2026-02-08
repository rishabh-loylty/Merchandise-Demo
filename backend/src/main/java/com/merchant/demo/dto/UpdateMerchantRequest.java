package com.merchant.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Map;

@Data
public class UpdateMerchantRequest {
    
    private String name;

    @JsonProperty("shopify_configured")
    private Boolean shopifyConfigured;

    @JsonProperty("source_config")
    private Map<String, Object> sourceConfig;
    
    // Helper to check if the DTO is effectively empty
    public boolean isEmpty() {
        return name == null && shopifyConfigured == null && sourceConfig == null;
    }
}