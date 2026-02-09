package com.merchant.demo.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.config.ShopifyAdapterProperties;
import com.merchant.demo.dto.GraphQLRequest;
import com.merchant.demo.dto.ShopifyConfig;
import com.merchant.demo.dto.shopify.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Production-ready adapter for syncing merchant catalog from Shopify Admin GraphQL API.
 * Uses API version and limits from {@link ShopifyAdapterProperties}. When a merchant
 * clicks sync, this fetches all products (with pagination) and the caller persists
 * them into staging tables.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShopifyAdapter {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final ShopifyAdapterProperties shopifyConfig;

    /**
     * Fetches all products for the given merchant config and returns them for persistence
     * into staging tables. Caller is responsible for clearing/upserting staging data.
     *
     * @param config merchant's store URL and access token (must be non-null, non-blank)
     * @return list of product nodes; never null (empty on no products or error after retries)
     * @throws IllegalArgumentException if config is invalid
     * @throws RuntimeException        on persistent API/network errors after retries
     */
    public List<ProductNode> fetchAllProducts(ShopifyConfig config) {
        validateConfig(config);
        String storeHost = normalizeStoreHost(config.storeUrl());
        String endpoint = "https://" + storeHost + "/admin/api/" + shopifyConfig.getApiVersion() + "/graphql.json";

        WebClient client = webClientBuilder
                .baseUrl(endpoint)
                .defaultHeader("X-Shopify-Access-Token", config.accessToken())
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();

        log.info("Starting catalog sync for store: {}", storeHost);

        List<ProductNode> allProducts = new ArrayList<>();
        String cursor = null;
        boolean hasNextPage = true;

        try {
            while (hasNextPage) {
                String requestBody = createRequestBody(cursor);
                ShopifyProductResponse response = executeWithRetry(client, requestBody);

                if (response == null || response.data() == null) {
                    throwOnGraphQLErrors(response);
                    throw new RuntimeException("Empty response from Shopify");
                }

                ProductConnection connection = response.data().products();
                for (ProductConnection.ProductEdge edge : connection.edges()) {
                    allProducts.add(edge.node());
                }

                hasNextPage = connection.pageInfo().hasNextPage();
                cursor = connection.pageInfo().endCursor();

                if (hasNextPage) {
                    log.debug("Fetched {} products so far, loading next page", allProducts.size());
                    sleep(shopifyConfig.getPageDelayMs());
                }
            }
        } catch (WebClientResponseException e) {
            log.error("Shopify API error for store {}: status={} body={}", storeHost, e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Shopify API error: " + e.getStatusCode(), e);
        } catch (Exception e) {
            log.error("Unexpected error during sync for store: {}", storeHost, e);
            throw new RuntimeException("Sync failed: " + e.getMessage(), e);
        }

        log.info("Fetched {} products from store: {}", allProducts.size(), storeHost);
        return allProducts;
    }

    private ShopifyProductResponse executeWithRetry(WebClient client, String requestBody) {
        Exception lastException = null;
        int maxRetries = shopifyConfig.getMaxRetries();
        long backoffMs = shopifyConfig.getRetryBackoffMs();

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                ShopifyProductResponse response = client.post()
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(ShopifyProductResponse.class)
                        .timeout(shopifyConfig.getRequestTimeout())
                        .block();

                throwOnGraphQLErrors(response);
                return response;
            } catch (WebClientResponseException e) {
                lastException = e;
                int status = e.getStatusCode().value();
                boolean retryable = status == 429 || (status >= 500 && status < 600);
                if (retryable && attempt < maxRetries) {
                    long backoff = backoffMs * (1L << attempt);
                    log.warn("Shopify request failed ({}), retry {}/{} in {}ms", status, attempt + 1, maxRetries, backoff);
                    sleep(backoff);
                } else if (retryable && attempt == maxRetries) {
                    throw new RuntimeException("Shopify API error after " + maxRetries + " retries: " + status, e);
                } else {
                    throw new RuntimeException("Shopify API error: " + e.getStatusCode(), e);
                }
            } catch (Exception e) {
                if (e.getCause() instanceof WebClientResponseException wcre) {
                    lastException = wcre;
                    int status = wcre.getStatusCode().value();
                    boolean retryable = status == 429 || (status >= 500 && status < 600);
                    if (retryable && attempt < maxRetries) {
                        long backoff = backoffMs * (1L << attempt);
                        log.warn("Shopify request failed ({}), retry {}/{} in {}ms", status, attempt + 1, maxRetries, backoff);
                        sleep(backoff);
                    } else if (retryable && attempt == maxRetries) {
                        throw new RuntimeException("Shopify API error after " + maxRetries + " retries: " + status, wcre);
                    } else {
                        throw new RuntimeException("Shopify API error: " + wcre.getStatusCode(), wcre);
                    }
                }
                throw e;
            }
        }
        throw new RuntimeException("Shopify request failed after retries", lastException);
    }

    private static void throwOnGraphQLErrors(ShopifyProductResponse response) {
        if (response != null && response.errors() != null && response.errors().length > 0) {
            String msg = response.errors()[0].message();
            throw new RuntimeException("Shopify GraphQL error: " + msg);
        }
    }

    private static void validateConfig(ShopifyConfig config) {
        Objects.requireNonNull(config, "ShopifyConfig must not be null");
        if (config.storeUrl() == null || config.storeUrl().isBlank()) {
            throw new IllegalArgumentException("Shopify store URL must not be null or blank");
        }
        if (config.accessToken() == null || config.accessToken().isBlank()) {
            throw new IllegalArgumentException("Shopify access token must not be null or blank");
        }
    }

    private static String normalizeStoreHost(String storeUrl) {
        String host = storeUrl
                .replace("https://", "")
                .replace("http://", "")
                .split("/")[0]
                .trim();
        if (host.isEmpty()) {
            throw new IllegalArgumentException("Invalid Shopify store URL: " + storeUrl);
        }
        if (!host.endsWith(".myshopify.com")) {
            host = host + ".myshopify.com";
        }
        return host;
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting for rate limit", e);
        }
    }

    private String buildProductsQuery() {
        int pageSize = shopifyConfig.getPageSize();
        int mediaFirst = shopifyConfig.getMediaFirst();
        int variantsFirst = shopifyConfig.getVariantsFirst();
        return """
            query getProducts($cursor: String) {
              products(first: %d, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                edges {
                  node {
                    id
                    title
                    descriptionHtml
                    vendor
                    productType
                    tags
                    options { name values }
                    media(first: %d) {
                      edges {
                        node {
                          id
                          mediaContentType
                          alt
                          preview { image { url } }
                          image { url altText }
                        }
                      }
                    }
                    variants(first: %d) {
                      edges {
                        node {
                          id
                          sku
                          barcode
                          price
                          selectedOptions { name value }
                        }
                      }
                    }
                  }
                }
              }
            }
            """.formatted(pageSize, mediaFirst, variantsFirst);
    }

    private String createRequestBody(String cursor) {
        try {
            Map<String, Object> variables = new java.util.HashMap<>();
            variables.put("cursor", cursor);
            GraphQLRequest request = new GraphQLRequest(buildProductsQuery(), variables);
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error building GraphQL request", e);
        }
    }
}
