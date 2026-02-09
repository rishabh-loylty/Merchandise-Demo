package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDecisionRequest {

    public static final String ACTION_CREATE_NEW = "CREATE_NEW";
    public static final String ACTION_LINK_EXISTING = "LINK_EXISTING";
    public static final String ACTION_REJECT = "REJECT";

    private String action;

    @JsonProperty("clean_data")
    private CleanDataDto cleanData;

    @JsonProperty("master_product_id")
    private Integer masterProductId;

    @JsonProperty("variant_mapping")
    private List<VariantMappingDto> variantMapping;

    @JsonProperty("rejection_reason")
    private String rejectionReason;

    @JsonProperty("admin_notes")
    private String adminNotes;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CleanDataDto {
        private String title;
        private String description;
        @JsonProperty("brand_id")
        private Integer brandId;
        @JsonProperty("category_id")
        private Integer categoryId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantMappingDto {
        @JsonProperty("staging_variant_id")
        private Integer stagingVariantId;
        @JsonProperty("master_variant_id")
        private Integer masterVariantId;
        @JsonProperty("new_variant_attributes")
        private java.util.Map<String, String> newVariantAttributes;
    }
}
