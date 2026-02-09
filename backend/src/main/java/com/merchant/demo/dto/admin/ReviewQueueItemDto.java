package com.merchant.demo.dto.admin;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewQueueItemDto {
    @JsonProperty("staging_id")
    private Integer stagingId;

    @JsonProperty("merchant_name")
    private String merchantName;

    @JsonProperty("raw_title")
    private String rawTitle;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonProperty("match_confidence")
    private Integer matchConfidence;

    @JsonProperty("suggested_master_id")
    private Integer suggestedMasterId;
}
