package com.merchant.demo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StagingProductListItemDto {
    private Integer id;
    private String title;
    private String vendor;
    private String productType;
    @JsonFormat(shape = JsonFormat.Shape.STRING, timezone = "UTC")
    private Instant createdAt;
    private String imageUrl;
    private String status;
}
