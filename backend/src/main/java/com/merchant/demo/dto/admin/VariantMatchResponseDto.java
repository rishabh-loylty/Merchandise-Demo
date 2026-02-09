package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantMatchResponseDto {
    @JsonProperty("staging_product_id")
    private Integer stagingProductId;

    @JsonProperty("master_product_id")
    private Integer masterProductId;

    @JsonProperty("matches")
    private List<VariantMatchSuggestionDto> matches;
}
