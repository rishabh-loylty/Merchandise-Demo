package com.merchant.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Duration;

/**
 * Configuration for Shopify Admin GraphQL API adapters.
 * All values are configurable via application.properties under {@code app.shopify}.
 */
@ConfigurationProperties(prefix = "app.shopify")
@Validated
public class ShopifyAdapterProperties {

    /** Admin API version (e.g. 2026-01 for LTS). */
    private String apiVersion = "2026-01";

    /** Products per page (Shopify max 250). */
    @Min(1)
    @Max(250)
    private int pageSize = 50;

    /** Delay between page requests in milliseconds (rate limiting). */
    @Min(0)
    private long pageDelayMs = 600;

    /** Request timeout per GraphQL call. */
    private Duration requestTimeout = Duration.ofSeconds(30);

    /** Max retries for 429 / 5xx. */
    @Min(0)
    @Max(10)
    private int maxRetries = 3;

    /** Initial retry backoff in milliseconds (doubled each attempt). */
    @Min(0)
    private long retryBackoffMs = 1000;

    /** Media items per product in the products query (media(first: N)). */
    @Min(0)
    @Max(250)
    private int mediaFirst = 10;

    /** Variants per product in the products query (variants(first: N)). */
    @Min(1)
    @Max(250)
    private int variantsFirst = 100;

    public String getApiVersion() {
        return apiVersion;
    }

    public void setApiVersion(String apiVersion) {
        this.apiVersion = apiVersion;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public long getPageDelayMs() {
        return pageDelayMs;
    }

    public void setPageDelayMs(long pageDelayMs) {
        this.pageDelayMs = pageDelayMs;
    }

    public Duration getRequestTimeout() {
        return requestTimeout;
    }

    public void setRequestTimeout(Duration requestTimeout) {
        this.requestTimeout = requestTimeout;
    }

    public int getMaxRetries() {
        return maxRetries;
    }

    public void setMaxRetries(int maxRetries) {
        this.maxRetries = maxRetries;
    }

    public long getRetryBackoffMs() {
        return retryBackoffMs;
    }

    public void setRetryBackoffMs(long retryBackoffMs) {
        this.retryBackoffMs = retryBackoffMs;
    }

    public int getMediaFirst() {
        return mediaFirst;
    }

    public void setMediaFirst(int mediaFirst) {
        this.mediaFirst = mediaFirst;
    }

    public int getVariantsFirst() {
        return variantsFirst;
    }

    public void setVariantsFirst(int variantsFirst) {
        this.variantsFirst = variantsFirst;
    }
}
