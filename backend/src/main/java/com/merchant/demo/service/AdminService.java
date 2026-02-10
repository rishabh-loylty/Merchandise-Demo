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
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryListItemDto> listCategories() {
        return categoryRepository.findAll().stream()
                .filter(c -> c.getIsActive() == null || Boolean.TRUE.equals(c.getIsActive()))
                .map(c -> CategoryListItemDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .slug(c.getSlug())
                        .parentId(c.getParentId())
                        .build())
                .collect(Collectors.toList());
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
            matches.add(VariantMatchSuggestionDto.builder()
                    .stagingVariantId(sv.getId())
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

        String optionsDefinition = StringUtils.hasText(clean.getOptionsDefinition())
                ? clean.getOptionsDefinition()
                : staging.getRawOptionsDefinition();

        String slug = generateSlug(clean.getTitle());
        Product newProduct = productRepository.save(Product.builder()
                .title(clean.getTitle())
                .slug(slug)
                .description(clean.getDescription())
                .brandId(clean.getBrandId())
                .status("ACTIVE")
                .optionsDefinition(optionsDefinition)
                .build());

        List<Integer> selectedMediaIds = clean.getSelectedMediaIds() != null ? clean.getSelectedMediaIds() : List.of();
        if (!selectedMediaIds.isEmpty()) {
            List<StagingMedia> stagingMediaList = stagingMediaRepository.findByIdInAndStagingProduct_Id(selectedMediaIds, staging.getId());
            if (stagingMediaList.size() != selectedMediaIds.size()) {
                throw new IllegalArgumentException("All selected_media_ids must belong to this staging product");
            }
            Map<Integer, StagingMedia> byId = stagingMediaList.stream().collect(Collectors.toMap(StagingMedia::getId, m -> m));
            String firstImageUrl = null;
            for (int i = 0; i < selectedMediaIds.size(); i++) {
                StagingMedia sm = byId.get(selectedMediaIds.get(i));
                if (sm == null) continue;
                if (firstImageUrl == null) firstImageUrl = sm.getSourceUrl();
                mediaRepository.save(Media.builder()
                        .productId(newProduct.getId())
                        .srcUrl(sm.getSourceUrl())
                        .altText(sm.getAltText())
                        .position(i)
                        .build());
            }
            if (firstImageUrl != null) {
                newProduct.setImageUrl(firstImageUrl);
                productRepository.save(newProduct);
            }
        }

        List<Integer> categoryIds = clean.getCategoryIds() != null ? clean.getCategoryIds() : List.of();
        for (Integer categoryId : categoryIds) {
            productCategoryRepository.save(ProductCategory.builder()
                    .productId(newProduct.getId())
                    .categoryId(categoryId)
                    .build());
        }

        for (StagingVariant sv : staging.getVariants()) {
            String internalSku = StringUtils.hasText(sv.getRawSku())
                    ? sv.getRawSku()
                    : "STG-" + staging.getId() + "-" + sv.getId();
            Variant newVariant = variantRepository.save(Variant.builder()
                    .product(newProduct)
                    .internalSku(internalSku)
                    .gtin(sv.getRawBarcode())
                    .options(sv.getRawOptions())
                    .isActive(true)
                    .status("ACTIVE")
                    .build());

            long priceMinor = sv.getRawPriceMinor() != null ? sv.getRawPriceMinor() : 0L;
            merchantOfferRepository.save(MerchantOffer.builder()
                    .merchantId(staging.getMerchantId())
                    .variantId(newVariant.getId())
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
        Set<Integer> mappedIds = mapping.stream().map(ReviewDecisionRequest.VariantMappingDto::getStagingVariantId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (!mappedIds.equals(stagingVariantIds) || mapping.size() != stagingVariantIds.size()) {
            throw new IllegalArgumentException("variant_mapping must contain exactly one entry per staging variant (link or add new)");
        }

        for (ReviewDecisionRequest.VariantMappingDto dto : mapping) {
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
}
