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
public class AdminStatsDto {
    @JsonProperty("pending_reviews")
    private long pendingReviews;

    @JsonProperty("total_master_products")
    private long totalMasterProducts;

    @JsonProperty("rejected_this_week")
    private long rejectedThisWeek;
}
