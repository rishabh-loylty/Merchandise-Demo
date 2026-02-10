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
        private String slug;
        private String description;
        @JsonProperty("brand_id")
        private Integer brandId;
        @JsonProperty("category_id")
        private Integer categoryId;
        /** Multiple category IDs for product_categories (CREATE_NEW). */
        @JsonProperty("category_ids")
        private List<Integer> categoryIds;
        /** Ordered list of staging_media IDs to copy as product media (CREATE_NEW). */
        @JsonProperty("selected_media_ids")
        private List<Integer> selectedMediaIds;
        /** Additional image URLs to add to the master product (CREATE_NEW). Appended after selected_media. */
        @JsonProperty("extra_media")
        private List<ExtraMediaItemDto> extraMedia;
        /** Product-level options definition JSON (e.g. Color, Size) for CREATE_NEW. */
        @JsonProperty("options_definition")
        private Object optionsDefinition;
        /** Product-level specifications JSON for CREATE_NEW. */
        @JsonProperty("specifications")
        private Object specifications;
        private List<VariantDto> variants;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariantDto {
        @JsonProperty("staging_variant_id")
        private Integer stagingVariantId;
        @JsonProperty("raw_sku")
        private String rawSku;
        @JsonProperty("raw_price_minor")
        private Long rawPriceMinor;
        @JsonProperty("raw_options")
        private java.util.Map<String, String> rawOptions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtraMediaItemDto {
        private String url;
        @JsonProperty("alt_text")
        private String altText;
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
