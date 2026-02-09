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
public class IssueProductDto {
    private Integer id;
    private String title;
    private String vendor;
    @JsonFormat(shape = JsonFormat.Shape.STRING, timezone = "UTC")
    private Instant rejectedAt;
    private String rejectionReason;
    private String imageUrl;
}
