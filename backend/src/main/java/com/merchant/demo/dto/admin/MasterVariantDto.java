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
public class MasterVariantDto {
    @JsonProperty("id")
    private Integer id;
    @JsonProperty("internal_sku")
    private String internalSku;
    @JsonProperty("gtin")
    private String gtin;
    @JsonProperty("options")
    private Map<String, String> options;
}
