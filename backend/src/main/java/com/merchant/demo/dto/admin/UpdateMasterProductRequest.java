package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UpdateMasterProductRequest {
    private String title;
    private String description;
    @JsonProperty("brand_id")
    private Integer brandId;
    @JsonProperty("image_url")
    private String imageUrl;
}
