package com.merchant.demo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.dto.admin.*;
import com.merchant.demo.entity.*;
import com.merchant.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final List<String> PENDING_REVIEW_STATUSES = List.of("PENDING", "NEEDS_REVIEW");

    private final StagingProductRepository stagingProductRepository;
    private final MerchantRepository merchantRepository;
    private final ProductRepository productRepository;
    private final VariantRepository variantRepository;
    private final BrandRepository brandRepository;
    private final MerchantOfferRepository merchantOfferRepository;
    private final MediaRepository mediaRepository;
    private final StagingMediaRepository stagingMediaRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public StagingDetailDto getStagingDetail(Integer stagingId) {
        StagingProduct staging = stagingProductRepository.findById(stagingId)
                .orElseThrow(() -> new NoSuchElementException("Staging product not found: " + stagingId));
        String merchantName = merchantRepository.findById(staging.getMerchantId())
                .map(Merchant::getName)
                .orElse("");
        String imageUrl = null;
        List<StagingDetailDto.StagingMediaItemDto> mediaList = new ArrayList<>();
        if (staging.getMedia() != null && !staging.getMedia().isEmpty()) {
            imageUrl = staging.getMedia().get(0).getSourceUrl();
            staging.getMedia().stream()
                    .sorted(Comparator.comparing(m -> m.getPosition() != null ? m.getPosition() : 0))
                    .forEach(m -> mediaList.add(StagingDetailDto.StagingMediaItemDto.builder()
                            .id(m.getId())
                            .sourceUrl(m.getSourceUrl())
                            .altText(m.getAltText())
                            .position(m.getPosition())
                            .build()));
        }
        List<StagingDetailDto.StagingVariantSummaryDto> variants = staging.getVariants().stream()
                .map(sv -> {
                    Map<String, String> options = parseOptions(sv.getRawOptions());
                    return StagingDetailDto.StagingVariantSummaryDto.builder()
                            .stagingVariantId(sv.getId())
                            .rawSku(sv.getRawSku())
                            .rawBarcode(sv.getRawBarcode())
                            .rawPriceMinor(sv.getRawPriceMinor())
                            .rawOptions(options)
                            .build();
                })
                .collect(Collectors.toList());
        return StagingDetailDto.builder()
                .stagingId(staging.getId())
                .merchantId(staging.getMerchantId())
                .merchantName(merchantName)
                .rawTitle(staging.getRawTitle())
                .rawBodyHtml(staging.getRawBodyHtml())
                .rawVendor(staging.getRawVendor())
                .rawProductType(staging.getRawProductType())
                .status(staging.getStatus())
                .matchConfidenceScore(staging.getMatchConfidenceScore())
                .suggestedProductId(staging.getSuggestedProductId())
                .createdAt(staging.getCreatedAt())
                .imageUrl(imageUrl)
                .media(mediaList)
                .variants(variants)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminStatsDto getStats() {
        long pendingReviews = stagingProductRepository.findByStatusInOrderByCreatedAtAsc(
                PENDING_REVIEW_STATUSES, PageRequest.of(0, 1)).getTotalElements();
        long totalMasterProducts = productRepository.count();
        Instant weekStart = Instant.now().minus(7, ChronoUnit.DAYS);
        long rejectedThisWeek = stagingProductRepository.countByStatusAndUpdatedAtAfter("REJECTED", weekStart);

        return AdminStatsDto.builder()
                .pendingReviews(pendingReviews)
                .totalMasterProducts(totalMasterProducts)
                .rejectedThisWeek(rejectedThisWeek)
                .build();
    }

    @Transactional(readOnly = true)
    public ReviewQueuePageDto getQueue(String status, Pageable pageable) {
        List<String> statuses = StringUtils.hasText(status)
                ? List.of(status)
                : PENDING_REVIEW_STATUSES;
        Page<StagingProduct> page = stagingProductRepository.findByStatusInOrderByCreatedAtAsc(statuses, pageable);
        Set<Integer> merchantIds = page.getContent().stream().map(StagingProduct::getMerchantId).collect(Collectors.toSet());
        Map<Integer, String> merchantNames = new HashMap<>();
        merchantRepository.findAllById(merchantIds).forEach(m -> merchantNames.put(m.getId(), m.getName()));

        List<ReviewQueueItemDto> content = page.getContent().stream()
                .map(p -> ReviewQueueItemDto.builder()
                        .stagingId(p.getId())
                        .merchantName(merchantNames.getOrDefault(p.getMerchantId(), ""))
                        .rawTitle(p.getRawTitle())
                        .createdAt(p.getCreatedAt())
                        .matchConfidence(p.getMatchConfidenceScore() != null ? p.getMatchConfidenceScore() : 0)
                        .suggestedMasterId(p.getSuggestedProductId())
                        .build())
                .collect(Collectors.toList());

        return ReviewQueuePageDto.builder()
                .content(content)
                .totalElements(page.getTotalElements())
                .build();
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<MasterProductListItemDto> getMasterProducts(Pageable pageable) {
        Page<Product> page = productRepository.findAll(pageable);
        Set<Integer> brandIds = new HashSet<>();
        page.getContent().forEach(p -> {
            if (p.getBrandId() != null) brandIds.add(p.getBrandId());
        });
        Map<Integer, String> brandNames = new HashMap<>();
        brandRepository.findAllById(brandIds).forEach(b -> brandNames.put(b.getId(), b.getName()));

        return page.map(p -> {
            int variantCount = variantRepository.findByProductId(p.getId()).size();
            return MasterProductListItemDto.builder()
                    .id(p.getId())
                    .title(p.getTitle())
                    .brand(brandNames.getOrDefault(p.getBrandId(), ""))
                    .imageUrl(p.getImageUrl())
                    .variantCount(variantCount)
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public List<MasterProductSearchDto> searchMasterProducts(String q) {
        if (!StringUtils.hasText(q) || q.isBlank()) {
            return List.of();
        }
        Page<Product> page = productRepository.searchByTitle(q.trim(), PageRequest.of(0, 10));
        Set<Integer> brandIds = new HashSet<>();
        page.getContent().forEach(p -> {
            if (p.getBrandId() != null) brandIds.add(p.getBrandId());
        });
        Map<Integer, String> brandNames = new HashMap<>();
        brandRepository.findAllById(brandIds).forEach(b -> brandNames.put(b.getId(), b.getName()));

        return page.getContent().stream()
                .map(p -> {
                    int variantCount = variantRepository.findByProductId(p.getId()).size();
                    return MasterProductSearchDto.builder()
                            .id(p.getId())
                            .title(p.getTitle())
                            .brand(brandNames.getOrDefault(p.getBrandId(), ""))
                            .imageUrl(p.getImageUrl())
                            .variantCount(variantCount)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BrandListItemDto> listBrands() {
        return brandRepository.findAll().stream()
                .filter(b -> b.getIsActive() == null || Boolean.TRUE.equals(b.getIsActive()))
                .map(b -> BrandListItemDto.builder()
                        .id(b.getId())
                        .name(b.getName())
                        .slug(b.getSlug())
                        .logoUrl(b.getLogoUrl())
                        .isActive(b.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryListItemDto> listCategories() {
        List<Category> all = categoryRepository.findAll();
        // Build a lookup so we can resolve parent names for path computation
        Map<Integer, Category> byId = all.stream()
                .collect(Collectors.toMap(Category::getId, c -> c));

        return all.stream()
                .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
                .map(c -> CategoryListItemDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .parentId(c.getParentId())
                        .icon(c.getIcon())
                        .path(c.getPath() != null ? c.getPath() : buildCategoryPath(c, byId))
                        .isActive(c.getIsActive())
                        .build())
                .collect(Collectors.toList());
    }

    /** Build the full path chain "Grandparent > Parent > Child" for a category. */
    private String buildCategoryPath(Category category, Map<Integer, Category> byId) {
        LinkedList<String> parts = new LinkedList<>();
        Category current = category;
        while (current != null) {
            parts.addFirst(current.getName());
            current = current.getParentId() != null ? byId.get(current.getParentId()) : null;
        }
        return String.join(" > ", parts);
    }

    @Transactional(readOnly = true)
    public List<MasterVariantDto> getProductVariants(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));
        return variantRepository.findByProductId(product.getId()).stream()
                .map(v -> MasterVariantDto.builder()
                        .id(v.getId())
                        .internalSku(v.getInternalSku())
                        .gtin(v.getGtin())
                        .options(parseOptions(v.getOptions()))
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VariantMatchResponseDto getVariantMatchSuggestions(Integer stagingId, Integer targetMasterId) {
        StagingProduct staging = stagingProductRepository.findById(stagingId)
                .orElseThrow(() -> new NoSuchElementException("Staging product not found: " + stagingId));
        Product master = productRepository.findById(targetMasterId)
                .orElseThrow(() -> new NoSuchElementException("Master product not found: " + targetMasterId));

        List<Variant> masterVariants = variantRepository.findByProductId(master.getId());
        List<VariantMatchSuggestionDto> matches = new ArrayList<>();

        for (StagingVariant sv : staging.getVariants()) {
            Integer suggestedId = null;
            String matchReason = "NONE";

            if (StringUtils.hasText(sv.getRawBarcode())) {
                for (Variant mv : masterVariants) {
                    if (sv.getRawBarcode().equals(mv.getGtin())) {
                        suggestedId = mv.getId();
                        matchReason = "BARCODE_MATCH";
                        break;
                    }
                }
            }
            if (suggestedId == null && StringUtils.hasText(sv.getRawSku())) {
                for (Variant mv : masterVariants) {
                    if (sv.getRawSku().equals(mv.getInternalSku())) {
                        suggestedId = mv.getId();
                        matchReason = "SKU_MATCH";
                        break;
                    }
                }
            }

            Map<String, String> options = parseOptions(sv.getRawOptions());

            // Try to match by options if no barcode/sku match found
            if (suggestedId == null && !options.isEmpty()) {
                String stagingKey = buildOptionsKey(options);
                for (Variant mv : masterVariants) {
                    Map<String, String> mvOptions = parseOptions(mv.getOptions());
                    if (!mvOptions.isEmpty() && stagingKey.equals(buildOptionsKey(mvOptions))) {
                        suggestedId = mv.getId();
                        matchReason = "OPTIONS_MATCH";
                        break;
                    }
                }
            }
            matches.add(VariantMatchSuggestionDto.builder()
                    .stagingVariantId(sv.getId())
                    .stagingSku(sv.getRawSku())
                    .stagingPriceMinor(sv.getRawPriceMinor())
                    .stagingOptions(options)
                    .suggestedMasterVariantId(suggestedId)
                    .matchReason(matchReason)
                    .build());
        }

        return VariantMatchResponseDto.builder()
                .stagingProductId(staging.getId())
                .masterProductId(master.getId())
                .matches(matches)
                .build();
    }

    @Transactional
    public void submitDecision(Integer stagingId, ReviewDecisionRequest request) {
        StagingProduct staging = stagingProductRepository.findById(stagingId)
                .orElseThrow(() -> new NoSuchElementException("Staging product not found: " + stagingId));

        switch (request.getAction()) {
            case ReviewDecisionRequest.ACTION_REJECT -> rejectStaging(staging, request);
            case ReviewDecisionRequest.ACTION_CREATE_NEW -> createNewMasterAndApprove(staging, request);
            case ReviewDecisionRequest.ACTION_LINK_EXISTING -> linkExistingAndApprove(staging, request);
            default -> throw new IllegalArgumentException("Unknown action: " + request.getAction());
        }
    }

    private void rejectStaging(StagingProduct staging, ReviewDecisionRequest request) {
        staging.setStatus("REJECTED");
        staging.setRejectionReason(request.getRejectionReason());
        staging.setAdminNotes(request.getAdminNotes());
        stagingProductRepository.save(staging);
    }

    private void createNewMasterAndApprove(StagingProduct staging, ReviewDecisionRequest request) {
        ReviewDecisionRequest.CleanDataDto clean = request.getCleanData();
        if (clean == null || clean.getTitle() == null) {
            throw new IllegalArgumentException("clean_data.title required for CREATE_NEW");
        }

        String slug = StringUtils.hasText(clean.getSlug()) ? clean.getSlug() : generateSlug(clean.getTitle());

        String specificationsJson = "{}";
        if (clean.getSpecifications() != null) {
            try {
                specificationsJson = objectMapper.writeValueAsString(clean.getSpecifications());
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid specifications JSON");
            }
        }

        String optionsDefinitionJson = "{}";
        if (clean.getOptionsDefinition() != null) {
            try {
                optionsDefinitionJson = objectMapper.writeValueAsString(clean.getOptionsDefinition());
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid options_definition JSON");
            }
        }


        Product newProduct = productRepository.save(Product.builder()
                .title(clean.getTitle())
                .slug(slug)
                .description(clean.getDescription())
                .brandId(clean.getBrandId())
                .status("ACTIVE")
                .specifications(specificationsJson)
                .optionsDefinition(optionsDefinitionJson)
                .build());

        List<Integer> selectedMediaIds = clean.getSelectedMediaIds() != null ? clean.getSelectedMediaIds() : List.of();
        String firstImageUrl = null;
        int mediaPosition = 0;

        if (!selectedMediaIds.isEmpty()) {
            List<StagingMedia> stagingMediaList = stagingMediaRepository.findByIdInAndStagingProduct_Id(selectedMediaIds, staging.getId());
            if (stagingMediaList.size() != selectedMediaIds.size()) {
                throw new IllegalArgumentException("All selected_media_ids must belong to this staging product");
            }
            Map<Integer, StagingMedia> byId = stagingMediaList.stream().collect(Collectors.toMap(StagingMedia::getId, m -> m));
            for (int i = 0; i < selectedMediaIds.size(); i++) {
                StagingMedia sm = byId.get(selectedMediaIds.get(i));
                if (sm == null) continue;
                if (firstImageUrl == null) firstImageUrl = sm.getSourceUrl();
                mediaRepository.save(Media.builder()
                        .productId(newProduct.getId())
                        .srcUrl(sm.getSourceUrl())
                        .altText(sm.getAltText())
                        .position(mediaPosition++)
                        .build());
            }
        }

        List<ReviewDecisionRequest.ExtraMediaItemDto> extraMedia = clean.getExtraMedia() != null ? clean.getExtraMedia() : List.of();
        for (ReviewDecisionRequest.ExtraMediaItemDto item : extraMedia) {
            if (item == null || item.getUrl() == null || !StringUtils.hasText(item.getUrl().trim())) continue;
            if (firstImageUrl == null) firstImageUrl = item.getUrl().trim();
            mediaRepository.save(Media.builder()
                    .productId(newProduct.getId())
                    .srcUrl(item.getUrl().trim())
                    .altText(StringUtils.hasText(item.getAltText()) ? item.getAltText().trim() : null)
                    .position(mediaPosition++)
                    .build());
        }
        if (firstImageUrl != null) {
            newProduct.setImageUrl(firstImageUrl);
            productRepository.save(newProduct);
        }

        List<Integer> categoryIds = clean.getCategoryIds() != null ? clean.getCategoryIds() : List.of();
        for (Integer categoryId : categoryIds) {
            productCategoryRepository.save(ProductCategory.builder()
                    .productId(newProduct.getId())
                    .categoryId(categoryId)
                    .build());
        }

        // --- Generate variants from options_definition cross-product ---
        Map<String, List<String>> optionsDef = parseOptionsDefinition(optionsDefinitionJson);

        List<Map<String, String>> variantCombinations;
        if (optionsDef.isEmpty()) {
            // No options: create a single default variant
            variantCombinations = List.of(Map.of());
        } else {
            // Guard against combinatorial explosion
            long expectedCount = optionsDef.values().stream()
                    .filter(v -> v != null && !v.isEmpty())
                    .mapToLong(List::size)
                    .reduce(1L, (a, b) -> a * b);
            if (expectedCount > 500) {
                throw new IllegalArgumentException(
                        "Options definition would generate " + expectedCount + " variants, which exceeds the maximum of 500. " +
                        "Reduce the number of option values.");
            }
            variantCombinations = computeCrossProduct(optionsDef);
        }

        // Build a map of staging variants indexed by their options for matching.
        // Only include option keys that are in the options_definition so that if the admin
        // removed an option (e.g. "Age"), staging variants still match on the remaining keys.
        Set<String> definedOptionKeys = optionsDef.keySet().stream()
                .map(k -> k.toLowerCase().trim())
                .collect(Collectors.toSet());
        Map<String, StagingVariant> stagingVariantByOptions = new HashMap<>();
        for (StagingVariant sv : staging.getVariants()) {
            Map<String, String> svOptions = parseOptions(sv.getRawOptions());
            Map<String, String> filteredOptions = svOptions.entrySet().stream()
                    .filter(e -> definedOptionKeys.contains(e.getKey().toLowerCase().trim()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
            String key = buildOptionsKey(filteredOptions);
            stagingVariantByOptions.put(key, sv);
        }

        for (int idx = 0; idx < variantCombinations.size(); idx++) {
            Map<String, String> combo = variantCombinations.get(idx);

            // Auto-generate internal SKU from slug + options
            String skuSuffix = combo.values().stream()
                    .map(v -> v.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", ""))
                    .collect(Collectors.joining("-"));
            String internalSku = slug + (skuSuffix.isEmpty() ? "" : "-" + skuSuffix)
                    + "-" + UUID.randomUUID().toString().substring(0, 6);

            String optionsJson;
            try {
                optionsJson = objectMapper.writeValueAsString(combo);
            } catch (Exception e) {
                optionsJson = "{}";
            }

            Variant newVariant = variantRepository.save(Variant.builder()
                    .product(newProduct)
                    .internalSku(internalSku)
                    .options(optionsJson)
                    .isActive(true)
                    .status("ACTIVE")
                    .build());

            // Try to match a staging variant by options to auto-create a merchant offer
            String comboKey = buildOptionsKey(combo);
            StagingVariant matchedSv = stagingVariantByOptions.get(comboKey);
            if (matchedSv != null) {
                createMerchantOffer(staging, matchedSv, newVariant.getId());
                stagingVariantByOptions.remove(comboKey); // prevent double-linking
            }
        }

        staging.setStatus("APPROVED");
        stagingProductRepository.save(staging);
    }

    private void linkExistingAndApprove(StagingProduct staging, ReviewDecisionRequest request) {
        Integer masterProductId = request.getMasterProductId();
        if (masterProductId == null) {
            throw new IllegalArgumentException("master_product_id required for LINK_EXISTING");
        }
        Product master = productRepository.findById(masterProductId)
                .orElseThrow(() -> new NoSuchElementException("Master product not found: " + masterProductId));

        List<ReviewDecisionRequest.VariantMappingDto> mapping = request.getVariantMapping() != null
                ? request.getVariantMapping()
                : List.of();

        Set<Integer> stagingVariantIds = staging.getVariants().stream().map(StagingVariant::getId).collect(Collectors.toSet());
        Set<Integer> mappedStagingIds = mapping.stream()
                .map(ReviewDecisionRequest.VariantMappingDto::getStagingVariantId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        // Allow partial mapping: mapped IDs must be a subset of actual staging variant IDs (admin may skip some)
        if (!stagingVariantIds.containsAll(mappedStagingIds)) {
            throw new IllegalArgumentException("variant_mapping contains staging variant IDs that don't belong to this staging product");
        }
        // Also allow entries without a staging_variant_id (manually added variants)
        List<ReviewDecisionRequest.VariantMappingDto> manualEntries = mapping.stream()
                .filter(dto -> dto.getStagingVariantId() == null)
                .toList();

        // Process entries that reference a staging variant (link or add_new with staging context)
        for (ReviewDecisionRequest.VariantMappingDto dto : mapping) {
            if (dto.getStagingVariantId() == null) continue; // handled below as manual entry

            StagingVariant sv = staging.getVariants().stream()
                    .filter(v -> v.getId().equals(dto.getStagingVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new NoSuchElementException("Staging variant not found: " + dto.getStagingVariantId()));

            Integer masterVariantId = dto.getMasterVariantId();
            Map<String, String> newAttrs = dto.getNewVariantAttributes() != null ? dto.getNewVariantAttributes() : Map.of();
            if (masterVariantId != null && !newAttrs.isEmpty()) {
                throw new IllegalArgumentException("Each variant_mapping entry must have either master_variant_id (link) or new_variant_attributes (add new), not both");
            }
            if (masterVariantId != null) {
                Variant mv = variantRepository.findById(masterVariantId).orElseThrow();
                if (!mv.getProduct().getId().equals(master.getId())) {
                    throw new IllegalArgumentException("Variant does not belong to selected master product");
                }
                createMerchantOffer(staging, sv, mv.getId());
            } else {
                if (newAttrs.isEmpty()) {
                    newAttrs = parseOptions(sv.getRawOptions());
                }
                String internalSku = "LINK-" + staging.getId() + "-" + sv.getId();
                Variant newVariant = variantRepository.save(Variant.builder()
                        .product(master)
                        .internalSku(internalSku)
                        .options(newAttrs.isEmpty() ? "{}" : toJsonOptions(newAttrs))
                        .isActive(true)
                        .status("ACTIVE")
                        .build());
                createMerchantOffer(staging, sv, newVariant.getId());
            }
        }

        // Process manually added variants (no staging_variant_id, only new_variant_attributes)
        for (ReviewDecisionRequest.VariantMappingDto dto : manualEntries) {
            Map<String, String> attrs = dto.getNewVariantAttributes() != null ? dto.getNewVariantAttributes() : Map.of();
            if (attrs.isEmpty()) continue;
            String internalSku = "MANUAL-" + staging.getId() + "-" + UUID.randomUUID().toString().substring(0, 8);
            variantRepository.save(Variant.builder()
                    .product(master)
                    .internalSku(internalSku)
                    .options(toJsonOptions(attrs))
                    .isActive(true)
                    .status("ACTIVE")
                    .build());
            // No merchant offer for manual variants (no staging variant to reference)
        }

        // --- Optionally add media to existing master product ---
        ReviewDecisionRequest.CleanDataDto clean = request.getCleanData();
        if (clean != null) {
            // Figure out the next position for new images
            List<Media> existingMedia = mediaRepository.findByProductIdOrderByPositionAsc(master.getId());
            int nextPosition = existingMedia.stream().mapToInt(Media::getPosition).max().orElse(-1) + 1;
            boolean setMainImage = (master.getImageUrl() == null || master.getImageUrl().isBlank());

            List<Integer> selectedMediaIds = clean.getSelectedMediaIds() != null ? clean.getSelectedMediaIds() : List.of();
            if (!selectedMediaIds.isEmpty()) {
                List<StagingMedia> stagingMediaList = stagingMediaRepository.findByIdInAndStagingProduct_Id(selectedMediaIds, staging.getId());
                Map<Integer, StagingMedia> byId = stagingMediaList.stream().collect(Collectors.toMap(StagingMedia::getId, m -> m));
                for (Integer smId : selectedMediaIds) {
                    StagingMedia sm = byId.get(smId);
                    if (sm == null) continue;
                    if (setMainImage) {
                        master.setImageUrl(sm.getSourceUrl());
                        productRepository.save(master);
                        setMainImage = false;
                    }
                    mediaRepository.save(Media.builder()
                            .productId(master.getId())
                            .srcUrl(sm.getSourceUrl())
                            .altText(sm.getAltText())
                            .position(nextPosition++)
                            .build());
                }
            }

            List<ReviewDecisionRequest.ExtraMediaItemDto> extraMedia = clean.getExtraMedia() != null ? clean.getExtraMedia() : List.of();
            for (ReviewDecisionRequest.ExtraMediaItemDto item : extraMedia) {
                if (item == null || item.getUrl() == null || !StringUtils.hasText(item.getUrl().trim())) continue;
                if (setMainImage) {
                    master.setImageUrl(item.getUrl().trim());
                    productRepository.save(master);
                    setMainImage = false;
                }
                mediaRepository.save(Media.builder()
                        .productId(master.getId())
                        .srcUrl(item.getUrl().trim())
                        .altText(StringUtils.hasText(item.getAltText()) ? item.getAltText().trim() : null)
                        .position(nextPosition++)
                        .build());
            }
        }

        staging.setStatus("APPROVED");
        stagingProductRepository.save(staging);
    }

    @Transactional
    public void updateMasterProduct(Integer productId, UpdateMasterProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));
        if (request.getTitle() != null) product.setTitle(request.getTitle());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getBrandId() != null) product.setBrandId(request.getBrandId());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        productRepository.save(product);
    }

    // ── Brand CRUD ──────────────────────────────────────────────────────

    @Transactional
    public BrandListItemDto createBrand(CreateBrandRequest request) {
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Brand name is required");
        }
        String slug = StringUtils.hasText(request.getSlug())
                ? request.getSlug()
                : request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        Brand brand = brandRepository.save(Brand.builder()
                .name(request.getName().trim())
                .slug(slug.trim())
                .logoUrl(request.getLogoUrl())
                .isActive(true)
                .build());
        return BrandListItemDto.builder()
                .id(brand.getId())
                .name(brand.getName())
                .slug(brand.getSlug())
                .logoUrl(brand.getLogoUrl())
                .isActive(brand.getIsActive())
                .build();
    }

    @Transactional
    public void updateBrand(Integer brandId, UpdateBrandRequest request) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NoSuchElementException("Brand not found: " + brandId));
        if (request.getName() != null) brand.setName(request.getName().trim());
        if (request.getSlug() != null) brand.setSlug(request.getSlug().trim());
        if (request.getLogoUrl() != null) brand.setLogoUrl(request.getLogoUrl());
        if (request.getIsActive() != null) brand.setIsActive(request.getIsActive());
        brandRepository.save(brand);
    }

    @Transactional
    public void deleteBrand(Integer brandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new NoSuchElementException("Brand not found: " + brandId));
        brandRepository.delete(brand);
    }

    // ── Category CRUD ───────────────────────────────────────────────────

    @Transactional
    public CategoryListItemDto createCategory(CreateCategoryRequest request) {
        if (!StringUtils.hasText(request.getName())) {
            throw new IllegalArgumentException("Category name is required");
        }
        String slug = StringUtils.hasText(request.getSlug())
                ? request.getSlug()
                : request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");

        // Resolve parent for path computation
        String parentPath = null;
        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new NoSuchElementException("Parent category not found: " + request.getParentId()));
            parentPath = parent.getPath() != null ? parent.getPath() : parent.getName();
        }
        String path = parentPath != null
                ? parentPath + " > " + request.getName().trim()
                : request.getName().trim();

        Category category = categoryRepository.save(Category.builder()
                .name(request.getName().trim())
                .slug(slug.trim())
                .parentId(request.getParentId())
                .icon(request.getIcon())
                .path(path)
                .isActive(true)
                .build());
        return CategoryListItemDto.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .parentId(category.getParentId())
                .icon(category.getIcon())
                .path(category.getPath())
                .isActive(category.getIsActive())
                .build();
    }

    @Transactional
    public void updateCategory(Integer categoryId, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        if (request.getName() != null) category.setName(request.getName().trim());
        if (request.getSlug() != null) category.setSlug(request.getSlug().trim());
        if (request.getParentId() != null) {
            if (request.getParentId().equals(categoryId)) {
                throw new IllegalArgumentException("Category cannot be its own parent");
            }
            category.setParentId(request.getParentId());
        }
        if (request.getIsActive() != null) category.setIsActive(request.getIsActive());
        categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Integer categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + categoryId));
        categoryRepository.delete(category);
    }

    private void createMerchantOffer(StagingProduct staging, StagingVariant sv, Integer variantId) {
        if (merchantOfferRepository.existsByMerchantIdAndVariantId(staging.getMerchantId(), variantId)) {
            return;
        }
        long priceMinor = sv.getRawPriceMinor() != null ? sv.getRawPriceMinor() : 0L;
        merchantOfferRepository.save(MerchantOffer.builder()
                .merchantId(staging.getMerchantId())
                .variantId(variantId)
                .externalProductId(staging.getExternalProductId())
                .externalVariantId(sv.getExternalVariantId())
                .merchantSku(sv.getRawSku())
                .currencyCode("INR")
                .cachedPriceMinor(priceMinor)
                .cachedSettlementPriceMinor(priceMinor)
                .currentStock(0)
                .isActive(true)
                .offerStatus("LIVE")
                .build());
    }

    private static String generateSlug(String title) {
        String base = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        String suffix = "-" + UUID.randomUUID().toString().substring(0, 8);
        return base.isEmpty() ? "product" + suffix : base + suffix;
    }

    private Map<String, String> parseOptionsToMap(String raw) {
        if (!StringUtils.hasText(raw)) return Map.of();
        try {
            return objectMapper.readValue(raw, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    private Map<String, String> parseOptions(String raw) {
        return parseOptionsToMap(raw);
    }

    private static String toJsonOptions(Map<String, String> attrs) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(attrs);
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Parse options_definition JSON like {"Color":["Red","Blue"],"Size":["S","M"]} into a Map.
     */
    private Map<String, List<String>> parseOptionsDefinition(String json) {
        if (!StringUtils.hasText(json) || "{}".equals(json.trim())) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, List<String>>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    /**
     * Compute the cross-product of all option values.
     * e.g. {Color:[Red,Blue], Size:[S,M]} → [{Color:Red,Size:S},{Color:Red,Size:M},{Color:Blue,Size:S},{Color:Blue,Size:M}]
     */
    private static List<Map<String, String>> computeCrossProduct(Map<String, List<String>> optionsDef) {
        List<Map<String, String>> result = new ArrayList<>();
        result.add(new LinkedHashMap<>());
        for (Map.Entry<String, List<String>> entry : optionsDef.entrySet()) {
            String optionName = entry.getKey();
            List<String> values = entry.getValue();
            if (values == null || values.isEmpty()) continue;
            List<Map<String, String>> expanded = new ArrayList<>();
            for (Map<String, String> existing : result) {
                for (String value : values) {
                    Map<String, String> copy = new LinkedHashMap<>(existing);
                    copy.put(optionName, value);
                    expanded.add(copy);
                }
            }
            result = expanded;
        }
        return result;
    }

    /**
     * Build a normalized key from option values for matching staging variants to master variants.
     * Lowercases and trims all values, sorts keys for consistent ordering.
     */
    private static String buildOptionsKey(Map<String, String> options) {
        if (options == null || options.isEmpty()) return "";
        return options.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey().toLowerCase().trim() + "=" + e.getValue().toLowerCase().trim())
                .collect(Collectors.joining("|"));
    }
}
