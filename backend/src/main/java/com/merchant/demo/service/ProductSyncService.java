package com.merchant.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.adapter.ShopifyAdapter;
import com.merchant.demo.dto.ShopifyConfig;
import com.merchant.demo.dto.SyncResultDto;
import com.merchant.demo.dto.shopify.*;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.entity.StagingMedia;
import com.merchant.demo.entity.StagingProduct;
import com.merchant.demo.entity.StagingVariant;
import com.merchant.demo.repository.MerchantRepository;
import com.merchant.demo.repository.StagingProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductSyncService {

    private final MerchantRepository merchantRepository;
    private final StagingProductRepository stagingProductRepository;
    private final ShopifyAdapter shopifyAdapter;
    private final ObjectMapper objectMapper;

    @Transactional
    public SyncResultDto syncProductsForMerchant(Integer merchantId) {
        Merchant merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new NoSuchElementException("Merchant not found: " + merchantId));

        // 1. Parse Config
        ShopifyConfig config = parseConfig(merchant.getSourceConfig());

        // 2. Fetch Raw Data from Shopify
        List<ProductNode> shopifyProducts = shopifyAdapter.fetchAllProducts(config);

        // 3. Process Products (Upsert)
        int productsProcessed = 0;
        int variantsProcessed = 0;

        for (ProductNode rawNode : shopifyProducts) {
            processSingleProduct(merchant, rawNode);
            productsProcessed++;
            variantsProcessed += rawNode.variants().edges().size();
        }

        return new SyncResultDto("Sync Successful", productsProcessed, variantsProcessed);
    }

    /**
     * Smart Upsert: Checks if product exists.
     * If yes -> Updates it. If Price/Title changed -> Set status NEEDS_REVIEW.
     * If no -> Creates new PENDING product.
     */
    private void processSingleProduct(Merchant merchant, ProductNode node) {
        Optional<StagingProduct> existingOpt = stagingProductRepository
                .findByMerchantIdAndExternalProductId(merchant.getId(), node.id());

        StagingProduct product;
        boolean needsReview = false;

        if (existingOpt.isPresent()) {
            product = existingOpt.get();
            // Check for critical changes before updating
            if (!Objects.equals(product.getRawTitle(), node.title())) {
                needsReview = true;
            }
            // (You can add more logic here: has the price changed significantly?)
        } else {
            product = new StagingProduct();
            product.setMerchantId(merchant.getId());
            product.setExternalProductId(node.id());
            product.setStatus("PENDING");
            product.setMatchConfidenceScore(0);
        }

        // Map Fields
        product.setRawTitle(node.title());
        product.setRawBodyHtml(node.descriptionHtml());
        product.setRawVendor(node.vendor());
        product.setRawProductType(node.productType());

        // Tags (Postgres text[] array)
        product.setRawTags(node.tags() != null ? new ArrayList<>(node.tags()) : new ArrayList<>());

        // Raw JSON Dump & Options Definition
        try {
            product.setRawJsonDump(objectMapper.writeValueAsString(node));
            product.setRawOptionsDefinition(objectMapper.writeValueAsString(node.options())); // CRITICAL for Frontend
        } catch (JsonProcessingException e) {
            log.error("JSON Error", e);
        }

        product.getMedia().clear();

        if (node.media() != null && node.media().edges() != null) {
            int positionCounter = 1;
            for (var mediaEdge : node.media().edges()) {
                var mediaNode = mediaEdge.node();
                if (mediaNode == null) continue;

                String url = null;
                String type = mediaNode.mediaContentType();

                // Handle different media types
                if ("IMAGE".equals(type) && mediaNode.image() != null) {
                    url = mediaNode.image().url();
                } else if (("VIDEO".equals(type) || "EXTERNAL_VIDEO".equals(type)) && mediaNode.preview() != null
                        && mediaNode.preview().image() != null) {
                    // For video, we save the preview image URL
                    url = mediaNode.preview().image().url();
                }

                if (url != null) {
                    StagingMedia media = StagingMedia.builder()
                            .externalMediaId(mediaNode.id())
                            .mediaType(type != null ? type : "IMAGE")
                            .sourceUrl(url)
                            .altText(mediaNode.alt())
                            .position(positionCounter++)
                            .build();

                    product.addMedia(media);
                }
            }
        }

        // Logic for Variants:
        // Strategy: Delete old variants for this staging product and re-insert new
        // ones.
        // Why? Matching variants by ID is complex if Shopify adds/removes options.
        // Since these are "Staging" variants, it's safer to refresh them on every sync.

        // Note: If you need to preserve Variant Status (e.g. APPROVED), you need a loop
        // to match externalVariantId here similar to the product loop.
        // For now, I will wipe and replace variants to ensure data accuracy.
        product.getVariants().clear();

        for (var vEdge : node.variants().edges()) {
            VariantNode vNode = vEdge.node();
            StagingVariant variant = new StagingVariant();

            variant.setExternalVariantId(vNode.id());
            variant.setRawSku(vNode.sku());
            variant.setRawBarcode(vNode.barcode());
            // Store price in minor units (cents)
            variant.setRawPriceMinor(new BigDecimal(vNode.price()).multiply(BigDecimal.valueOf(100)).longValue());

            // Map Options { "Color": "Red" }
            Map<String, String> optionsMap = new HashMap<>();
            vNode.selectedOptions().forEach(opt -> optionsMap.put(opt.name(), opt.value()));
            try {
                variant.setRawOptions(objectMapper.writeValueAsString(optionsMap));
            } catch (JsonProcessingException e) {
                variant.setRawOptions("{}");
            }

            variant.setStatus("PENDING"); // Default to Pending

            // Link to Parent
            product.addVariant(variant);
        }

        // If it was an update and critical data changed, flag it
        if (existingOpt.isPresent() && needsReview && !product.getStatus().equals("PENDING")) {
            product.setStatus("NEEDS_REVIEW");
            product.setAdminNotes("Auto-Sync: Product details changed on Shopify.");
        }

        stagingProductRepository.save(product);
    }

    private ShopifyConfig parseConfig(String jsonConfig) {
        try {
            return objectMapper.readValue(jsonConfig, ShopifyConfig.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Invalid Merchant Config");
        }
    }
}
