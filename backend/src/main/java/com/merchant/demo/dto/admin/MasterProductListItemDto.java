package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterProductListItemDto {
    private Integer id;
    private String title;
    private String brand;
    @JsonProperty("image_url")
    private String imageUrl;
    @JsonProperty("variant_count")
    private int variantCount;
}
