package com.merchant.demo.adapter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.config.ShopifyAdapterProperties;
import com.merchant.demo.dto.GraphQLRequest;
import com.merchant.demo.dto.ShopifyConfig;
import com.merchant.demo.dto.shopify.StagingProductDto;
import com.merchant.demo.dto.shopify.StagingVariantDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Alternative adapter that returns {@link StagingProductDto} (simplified DTOs).
 * For catalog sync to staging tables, the main path is {@link ShopifyAdapter}.
 * All limits and API version come from {@link ShopifyAdapterProperties}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ShopifyAdapterImpl {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    private final ShopifyAdapterProperties shopifyConfig;

    public List<StagingProductDto> fetchProducts(ShopifyConfig config) {
        Objects.requireNonNull(config, "ShopifyConfig must not be null");
        if (config.storeUrl() == null || config.storeUrl().isBlank()
                || config.accessToken() == null || config.accessToken().isBlank()) {
            throw new IllegalArgumentException("Store URL and access token must be non-blank");
        }

        String host = config.storeUrl()
                .replace("https://", "")
                .replace("http://", "")
                .split("/")[0]
                .trim();
        if (!host.endsWith(".myshopify.com")) {
            host = host + ".myshopify.com";
        }
        String endpoint = "https://" + host + "/admin/api/" + shopifyConfig.getApiVersion() + "/graphql.json";

        WebClient client = webClientBuilder.baseUrl(endpoint)
                .defaultHeader("X-Shopify-Access-Token", config.accessToken())
                .defaultHeader("Content-Type", "application/json")
                .build();

        List<StagingProductDto> allProducts = new ArrayList<>();
        String cursor = null;
        boolean hasNext = true;

        String productsQuery = buildProductsQuery();

        while (hasNext) {
            Map<String, Object> variables = new HashMap<>();
            variables.put("cursor", cursor);
            String body = toJson(new GraphQLRequest(productsQuery, variables));
            JsonNode response = client.post()
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null || !response.has("data")) {
                if (response != null && response.has("errors")) {
                    String msg = response.get("errors").get(0).path("message").asText("");
                    throw new RuntimeException("Shopify GraphQL error: " + msg);
                }
                throw new RuntimeException("Empty response from Shopify");
            }

            JsonNode products = response.path("data").path("products");
            JsonNode edges = products.path("edges");
            for (JsonNode edge : edges) {
                allProducts.add(parseProductNode(edge.path("node")));
            }

            JsonNode pageInfo = products.path("pageInfo");
            hasNext = pageInfo.path("hasNextPage").asBoolean(false);
            cursor = pageInfo.path("endCursor").asText(null);

            if (hasNext && cursor != null) {
                sleep(shopifyConfig.getPageDelayMs());
            }
        }

        return allProducts;
    }

    private String buildProductsQuery() {
        int pageSize = shopifyConfig.getPageSize();
        int variantsFirst = shopifyConfig.getVariantsFirst();
        return """
            query getProducts($cursor: String) {
              products(first: %d, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                edges {
                  node {
                    id title vendor
                    variants(first: %d) {
                      edges {
                        node {
                          id sku barcode price
                          selectedOptions { name value }
                        }
                      }
                    }
                  }
                }
              }
            }
            """.formatted(pageSize, variantsFirst);
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Sync interrupted", e);
        }
    }

    private String toJson(GraphQLRequest request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error building GraphQL request", e);
        }
    }

    private StagingProductDto parseProductNode(JsonNode productNode) {
        List<StagingVariantDto> variants = new ArrayList<>();
        for (JsonNode variantEdge : productNode.path("variants").path("edges")) {
            JsonNode v = variantEdge.path("node");
            String optionsJson = "{}";
            try {
                optionsJson = objectMapper.writeValueAsString(v.path("selectedOptions"));
            } catch (Exception e) {
                log.debug("Failed to serialize variant options");
            }
            variants.add(new StagingVariantDto(
                    v.path("id").asText(),
                    v.path("sku").asText(null),
                    v.path("barcode").asText(null),
                    new BigDecimal(v.path("price").asText("0")),
                    optionsJson
            ));
        }
        return new StagingProductDto(
                productNode.path("id").asText(),
                productNode.path("title").asText(),
                productNode.path("vendor").asText(null),
                variants
        );
    }
}
