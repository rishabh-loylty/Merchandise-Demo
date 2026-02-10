package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StagingDetailDto {
    @JsonProperty("staging_id")
    private Integer stagingId;

    @JsonProperty("merchant_id")
    private Integer merchantId;

    @JsonProperty("merchant_name")
    private String merchantName;

    @JsonProperty("raw_title")
    private String rawTitle;

    @JsonProperty("raw_body_html")
    private String rawBodyHtml;

    @JsonProperty("raw_vendor")
    private String rawVendor;

    @JsonProperty("raw_product_type")
    private String rawProductType;

    @JsonProperty("status")
    private String status;

    @JsonProperty("match_confidence_score")
    private Integer matchConfidenceScore;

    @JsonProperty("suggested_product_id")
    private Integer suggestedProductId;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonProperty("image_url")
    private String imageUrl;

    /** Staging media for image picker (select + order when creating new product). */
    @JsonProperty("media")
    private List<StagingMediaItemDto> media;

    @JsonProperty("variants")
    private List<StagingVariantSummaryDto> variants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StagingMediaItemDto {
        @JsonProperty("id")
        private Integer id;
        @JsonProperty("source_url")
        private String sourceUrl;
        @JsonProperty("alt_text")
        private String altText;
        @JsonProperty("position")
        private Integer position;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StagingVariantSummaryDto {
        @JsonProperty("staging_variant_id")
        private Integer stagingVariantId;
        @JsonProperty("raw_sku")
        private String rawSku;
        @JsonProperty("raw_barcode")
        private String rawBarcode;
        @JsonProperty("raw_price_minor")
        private Long rawPriceMinor;
        @JsonProperty("raw_options")
        private Map<String, String> rawOptions;
    }
}
