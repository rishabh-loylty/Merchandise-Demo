package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantMatchSuggestionDto {
    @JsonProperty("staging_variant_id")
    private Integer stagingVariantId;

    @JsonProperty("staging_options")
    private Map<String, String> stagingOptions;

    @JsonProperty("suggested_master_variant_id")
    private Integer suggestedMasterVariantId;

    @JsonProperty("match_reason")
    private String matchReason;
}
