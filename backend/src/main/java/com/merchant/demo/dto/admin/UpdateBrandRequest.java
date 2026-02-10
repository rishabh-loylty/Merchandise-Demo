package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBrandRequest {
    private String name;
    private String slug;
    @JsonProperty("logo_url")
    private String logoUrl;
    @JsonProperty("is_active")
    private Boolean isActive;
}
