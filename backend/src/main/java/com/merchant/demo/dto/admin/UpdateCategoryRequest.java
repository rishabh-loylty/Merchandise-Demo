package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryRequest {
    private String name;
    private String slug;
    @JsonProperty("parent_id")
    private Integer parentId;
    @JsonProperty("is_active")
    private Boolean isActive;
}
