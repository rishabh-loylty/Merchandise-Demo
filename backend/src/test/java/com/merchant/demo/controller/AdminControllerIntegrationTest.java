package com.merchant.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.dto.admin.CreateBrandRequest;
import com.merchant.demo.dto.admin.CreateCategoryRequest;
import com.merchant.demo.dto.admin.ReviewDecisionRequest;
import com.merchant.demo.dto.admin.UpdateBrandRequest;
import com.merchant.demo.dto.admin.UpdateCategoryRequest;
import com.merchant.demo.dto.admin.UpdateMasterProductRequest;
import com.merchant.demo.entity.*;
import com.merchant.demo.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class AdminControllerIntegrationTest {

    // Starts a Postgres container matching your specific version
    private static final DockerImageName POSTGRES_IMAGE = DockerImageName.parse("postgres:16"); // Or another version
    
    @Container
    @ServiceConnection
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(POSTGRES_IMAGE);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StagingProductRepository stagingProductRepository;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private VariantRepository variantRepository;

    @Autowired
    private MerchantOfferRepository merchantOfferRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private StagingMediaRepository stagingMediaRepository;

    private Merchant merchant;
    private Brand brand;
    private Product masterProduct;
    private Variant masterVariant;

    @BeforeEach
    void setUp() {
        merchantOfferRepository.deleteAll();
        variantRepository.deleteAll();
        stagingProductRepository.deleteAll(); // before products (staging_products.suggested_product_id FK)
        productRepository.deleteAll();
        merchantRepository.deleteAll();
        brandRepository.deleteAll();
        categoryRepository.deleteAll();

        merchant = merchantRepository.save(Merchant.builder()
                .name("Nike Official")
                .email("nike@test.com")
                .isActive(true)
                .build());

        brand = brandRepository.save(Brand.builder()
                .name("Nike")
                .slug("nike")
                .isActive(true)
                .build());

        masterProduct = productRepository.save(Product.builder()
                .title("Nike Air Max 90")
                .slug("nike-air-max-90")
                .brandId(brand.getId())
                .status("ACTIVE")
                .build());

        masterVariant = variantRepository.save(Variant.builder()
                .product(masterProduct)
                .internalSku("NIKE-AM90-001")
                .gtin("1234567890123")
                .isActive(true)
                .status("ACTIVE")
                .build());
    }

    @Test
    void getAdminStats_returnsCounts() throws Exception {
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Item 1")
                .rawVendor("V")
                .status("PENDING")
                .build());
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Item 2")
                .rawVendor("V")
                .status("NEEDS_REVIEW")
                .build());

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pending_reviews", is(2)))
                .andExpect(jsonPath("$.total_master_products", is(1)))
                .andExpect(jsonPath("$.rejected_this_week").exists());
    }


    @Test
    void getStagingDetail_returnsStagingProductDetails() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Staging Product Title")
                .rawBodyHtml("Staging Product Body")
                .rawVendor("Staging Vendor")
                .rawProductType("Staging Type")
                .status("PENDING")
                .build());

        StagingVariant sv1 = StagingVariant.builder()
                .rawSku("SV-SKU-1")
                .rawBarcode("111222333444")
                .rawPriceMinor(1000L)
                .rawOptions("{\"Color\": \"Red\", \"Size\": \"M\"}")
                .build();
        sp.addVariant(sv1);

        StagingMedia sm1 = StagingMedia.builder()
                .sourceUrl("http://example.com/image1.jpg")
                .altText("Image 1")
                .position(0)
                .build();
        StagingMedia sm2 = StagingMedia.builder()
                .sourceUrl("http://example.com/image2.jpg")
                .altText("Image 2")
                .position(1)
                .build();
        sp.addMedia(sm1);
        sp.addMedia(sm2);

        sp = stagingProductRepository.save(sp); // Save with variants and media

        mockMvc.perform(get("/api/admin/review/{stagingId}", sp.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staging_id", is(sp.getId())))
                .andExpect(jsonPath("$.merchant_id", is(merchant.getId())))
                .andExpect(jsonPath("$.merchant_name", is(merchant.getName())))
                .andExpect(jsonPath("$.raw_title", is("Staging Product Title")))
                .andExpect(jsonPath("$.image_url", is("http://example.com/image1.jpg")))
                .andExpect(jsonPath("$.media", hasSize(2)))
                .andExpect(jsonPath("$.media[0].source_url", is("http://example.com/image1.jpg")))
                .andExpect(jsonPath("$.variants", hasSize(1)))
                .andExpect(jsonPath("$.variants[0].raw_sku", is("SV-SKU-1")))
                .andExpect(jsonPath("$.variants[0].raw_options.Color", is("Red")));
    }

    @Test
    void getStagingDetail_notFound() throws Exception {
        mockMvc.perform(get("/api/admin/review/{stagingId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void listBrands_returnsOnlyActiveBrands() throws Exception {
        Brand activeBrand = brandRepository.save(Brand.builder()
                .name("Active Brand")
                .slug("active-brand")
                .isActive(true)
                .build());
        brandRepository.save(Brand.builder()
                .name("Inactive Brand")
                .slug("inactive-brand")
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/admin/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Existing 'Nike' and 'Active Brand'
                .andExpect(jsonPath("$[?(@.name == 'Active Brand')].id", contains(activeBrand.getId())))
                .andExpect(jsonPath("$[?(@.name == 'Inactive Brand')]").doesNotExist());
    }

    @Test
    void createBrand_success() throws Exception {
        CreateBrandRequest req = new CreateBrandRequest("New Brand", "new-brand", "http://logo.url");
        mockMvc.perform(post("/api/admin/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Brand")))
                .andExpect(jsonPath("$.slug", is("new-brand")));
    }

    @Test
    void createBrand_badRequest_missingName() throws Exception {
        CreateBrandRequest req = new CreateBrandRequest(null, "new-brand", "http://logo.url");
        mockMvc.perform(post("/api/admin/brands")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateBrand_success() throws Exception {
        Brand brandToUpdate = brandRepository.save(Brand.builder()
                .name("Old Name")
                .slug("old-slug")
                .isActive(true)
                .build());
        UpdateBrandRequest req = new UpdateBrandRequest("Updated Name", "updated-slug", null, false);
        mockMvc.perform(patch("/api/admin/brands/{brandId}", brandToUpdate.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
        Brand updatedBrand = brandRepository.findById(brandToUpdate.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Updated Name", updatedBrand.getName());
        org.junit.jupiter.api.Assertions.assertEquals("updated-slug", updatedBrand.getSlug());
        org.junit.jupiter.api.Assertions.assertFalse(updatedBrand.getIsActive());
    }

    @Test
    void updateBrand_notFound() throws Exception {
        UpdateBrandRequest req = new UpdateBrandRequest("Updated Name", null, null, null);
        mockMvc.perform(patch("/api/admin/brands/{brandId}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteBrand_success() throws Exception {
        Brand brandToDelete = brandRepository.save(Brand.builder()
                .name("Brand To Delete")
                .slug("brand-to-delete")
                .isActive(true)
                .build());
        mockMvc.perform(delete("/api/admin/brands/{brandId}", brandToDelete.getId()))
                .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertFalse(brandRepository.findById(brandToDelete.getId()).isPresent());
    }

    @Test
    void deleteBrand_notFound() throws Exception {
        mockMvc.perform(delete("/api/admin/brands/{brandId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void listCategories_returnsOnlyActiveCategoriesWithPaths() throws Exception {
        Category parentCategory = categoryRepository.save(Category.builder()
                .name("Parent Cat")
                .slug("parent-cat")
                .isActive(true)
                .build());
        Category activeCategory = categoryRepository.save(Category.builder()
                .name("Active Cat")
                .slug("active-cat")
                .parentId(parentCategory.getId())
                .isActive(true)
                .build());
        categoryRepository.save(Category.builder()
                .name("Inactive Cat")
                .slug("inactive-cat")
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/admin/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Only active categories
                .andExpect(jsonPath("$[?(@.name == 'Parent Cat')].id", contains(parentCategory.getId())))
                .andExpect(jsonPath("$[?(@.name == 'Active Cat')].id", contains(activeCategory.getId())))
                .andExpect(jsonPath("$[?(@.name == 'Active Cat')].path", contains("Parent Cat > Active Cat")))
                .andExpect(jsonPath("$[?(@.name == 'Inactive Cat')]").doesNotExist());
    }

    @Test
    void createCategory_success() throws Exception {
        CreateCategoryRequest req = new CreateCategoryRequest("New Category", "new-category", null, null);
        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Category")))
                .andExpect(jsonPath("$.slug", is("new-category")))
                .andExpect(jsonPath("$.path", is("New Category")));
    }

    @Test
    void createCategory_success_withParent() throws Exception {
        Category parent = categoryRepository.save(Category.builder()
                .name("Parent")
                .slug("parent")
                .isActive(true)
                .build());
        CreateCategoryRequest req = new CreateCategoryRequest("Child Category", "child-category", parent.getId(), null);
        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Child Category")))
                .andExpect(jsonPath("$.path", is("Parent > Child Category")));
    }

    @Test
    void createCategory_badRequest_missingName() throws Exception {
        CreateCategoryRequest req = new CreateCategoryRequest(null, "new-category", null, null);
        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createCategory_notFound_parent() throws Exception {
        CreateCategoryRequest req = new CreateCategoryRequest("Child Category", "child-category", 99999, null);
        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateCategory_success() throws Exception {
        Category categoryToUpdate = categoryRepository.save(Category.builder()
                .name("Old Category")
                .slug("old-category")
                .isActive(true)
                .build());
        UpdateCategoryRequest req = new UpdateCategoryRequest("Updated Category", "updated-category", null, false);
        mockMvc.perform(patch("/api/admin/categories/{categoryId}", categoryToUpdate.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
        Category updatedCategory = categoryRepository.findById(categoryToUpdate.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Updated Category", updatedCategory.getName());
        org.junit.jupiter.api.Assertions.assertFalse(updatedCategory.getIsActive());
    }

    @Test
    void updateCategory_notFound() throws Exception {
        UpdateCategoryRequest req = new UpdateCategoryRequest("Updated Category", null, null, null);
        mockMvc.perform(patch("/api/admin/categories/{categoryId}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateCategory_badRequest_selfParenting() throws Exception {
        Category categoryToUpdate = categoryRepository.save(Category.builder()
                .name("Category")
                .slug("category")
                .isActive(true)
                .build());
        UpdateCategoryRequest req = new UpdateCategoryRequest(null, null, categoryToUpdate.getId(), null);
        mockMvc.perform(patch("/api/admin/categories/{categoryId}", categoryToUpdate.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteCategory_success() throws Exception {
        Category categoryToDelete = categoryRepository.save(Category.builder()
                .name("Category To Delete")
                .slug("category-to-delete")
                .isActive(true)
                .build());
        mockMvc.perform(delete("/api/admin/categories/{categoryId}", categoryToDelete.getId()))
                .andExpect(status().isNoContent());
        org.junit.jupiter.api.Assertions.assertFalse(categoryRepository.findById(categoryToDelete.getId()).isPresent());
    }

    @Test
    void deleteCategory_notFound() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/{categoryId}", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void getProductVariants_returnsProductVariants() throws Exception {
        Variant variant1 = variantRepository.save(Variant.builder()
                .product(masterProduct)
                .internalSku("MV-SKU-1")
                .gtin("1111111111111")
                .options("{\"Color\": \"Blue\", \"Size\": \"L\"}")
                .isActive(true)
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/admin/products/{productId}/variants", masterProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Existing masterVariant + variant1
                .andExpect(jsonPath("$[?(@.internal_sku == '" + masterVariant.getInternalSku() + "')].internal_sku", contains(masterVariant.getInternalSku())))
                .andExpect(jsonPath("$[?(@.id == " + variant1.getId() + ")].options.Color", contains("Blue")));
    }

    @Test
    void getProductVariants_notFound() throws Exception {
        mockMvc.perform(get("/api/admin/products/{productId}/variants", 99999))
                .andExpect(status().isNotFound());
    }

    @Test
    void getMasterProducts_returnsPaginatedMasterProducts() throws Exception {
        Product product2 = productRepository.save(Product.builder()
                .title("Another Product")
                .slug("another-product")
                .brandId(brand.getId())
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/admin/products")
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements", is(2))); // masterProduct + product2
    }

    @Test
    void updateMasterProduct_success() throws Exception {
        UpdateMasterProductRequest req = new UpdateMasterProductRequest();
        req.setTitle("Updated Title");
        req.setDescription("Updated Description");
        req.setImageUrl("http://updated.image.url");
        req.setBrandId(brand.getId()); // Use an existing brand

        mockMvc.perform(patch("/api/admin/products/{productId}", masterProduct.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        Product updatedProduct = productRepository.findById(masterProduct.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Updated Title", updatedProduct.getTitle());
        org.junit.jupiter.api.Assertions.assertEquals("Updated Description", updatedProduct.getDescription());
        org.junit.jupiter.api.Assertions.assertEquals("http://updated.image.url", updatedProduct.getImageUrl());
    }

    @Test
    void updateMasterProduct_notFound() throws Exception {
        UpdateMasterProductRequest req = new UpdateMasterProductRequest();
        req.setTitle("Updated Title");

        mockMvc.perform(patch("/api/admin/products/{productId}", 99999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void postDecision_linkExisting_createsMerchantOffers() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Staging to Link")
                .rawVendor("V")
                .status("PENDING")
                .build());
        StagingVariant sv1 = StagingVariant.builder()
                .rawSku("SV-LINK-1")
                .externalVariantId("EXT-VAR-1")
                .rawPriceMinor(1500L)
                .build();
        sp.addVariant(sv1);
        StagingVariant sv2 = StagingVariant.builder()
                .rawSku("SV-LINK-2")
                .rawPriceMinor(2000L)
                .build();
        sp.addVariant(sv2);
        sp = stagingProductRepository.save(sp);

        // A variant that already exists in the master product
        Variant existingMasterVariant = variantRepository.save(Variant.builder()
                .product(masterProduct)
                .internalSku("EXISTING-MV")
                .gtin("9876543210987")
                .isActive(true)
                .status("ACTIVE")
                .build());

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_LINK_EXISTING);
        req.setMasterProductId(masterProduct.getId());

        ReviewDecisionRequest.VariantMappingDto mapping1 = new ReviewDecisionRequest.VariantMappingDto();
        mapping1.setStagingVariantId(sp.getVariants().get(0).getId());
        mapping1.setMasterVariantId(existingMasterVariant.getId()); // Link to existing

        ReviewDecisionRequest.VariantMappingDto mapping2 = new ReviewDecisionRequest.VariantMappingDto();
        mapping2.setStagingVariantId(sp.getVariants().get(1).getId());
        mapping2.setNewVariantAttributes(Map.of("Color", "Green", "Size", "XL")); // Create new from staging

        ReviewDecisionRequest.VariantMappingDto manualMapping = new ReviewDecisionRequest.VariantMappingDto();
        manualMapping.setNewVariantAttributes(Map.of("Type", "Manual")); // Create manual new variant

        req.setVariantMapping(List.of(mapping1, mapping2, manualMapping));

        // Add some media to clean data for the existing product
        ReviewDecisionRequest.CleanDataDto cleanData = new ReviewDecisionRequest.CleanDataDto();
        StagingMedia sm = stagingMediaRepository.save(StagingMedia.builder()
                .stagingProduct(sp)
                .sourceUrl("http://staging.media/image.jpg")
                .position(0)
                .build());
        cleanData.setSelectedMediaIds(List.of(sm.getId()));
        ReviewDecisionRequest.ExtraMediaItemDto extraMedia = new ReviewDecisionRequest.ExtraMediaItemDto();
        extraMedia.setUrl("http://extra.media/img.png");
        cleanData.setExtraMedia(List.of(extraMedia));
        req.setCleanData(cleanData);

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        StagingProduct updatedStaging = stagingProductRepository.findById(sp.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("APPROVED", updatedStaging.getStatus());

        long merchantOffers = merchantOfferRepository.count();
        org.junit.jupiter.api.Assertions.assertEquals(2, merchantOffers); // 1 for existingMasterVariant, 1 for new variant from staging. Manual variants do not create merchant offers.

        long masterProductVariants = variantRepository.findByProductId(masterProduct.getId()).size();
        org.junit.jupiter.api.Assertions.assertEquals(4, masterProductVariants); // 2 initially + 2 new (from staging and manual)

        Product updatedMasterProduct = productRepository.findById(masterProduct.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("http://staging.media/image.jpg", updatedMasterProduct.getImageUrl());
    }

    @Test
    void postDecision_linkExisting_missingMasterProductId() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Staging to Link")
                .rawVendor("V")
                .status("PENDING")
                .build());

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_LINK_EXISTING);
        // masterProductId is null

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postDecision_linkExisting_masterProductIdNotFound() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Staging to Link")
                .rawVendor("V")
                .status("PENDING")
                .build());

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_LINK_EXISTING);
        req.setMasterProductId(99999); // Non-existent master product ID

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void postDecision_linkExisting_invalidVariantMapping() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Staging to Link")
                .rawVendor("V")
                .status("PENDING")
                .build());

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_LINK_EXISTING);
        req.setMasterProductId(masterProduct.getId());

        ReviewDecisionRequest.VariantMappingDto mapping = new ReviewDecisionRequest.VariantMappingDto();
        mapping.setStagingVariantId(99999); // Staging variant ID not belonging to sp
        req.setVariantMapping(List.of(mapping));

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAdminQueue_returnsPaginatedQueue() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Nike Air Max 90")
                .rawVendor("Nike")
                .status("PENDING")
                .matchConfidenceScore(95)
                .suggestedProductId(masterProduct.getId())
                .build());

        mockMvc.perform(get("/api/admin/queue")
                        .param("status", "PENDING")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].staging_id", is(sp.getId())))
                .andExpect(jsonPath("$.content[0].merchant_name", is("Nike Official")))
                .andExpect(jsonPath("$.content[0].raw_title", is("Nike Air Max 90")))
                .andExpect(jsonPath("$.content[0].match_confidence", is(95)))
                .andExpect(jsonPath("$.content[0].suggested_master_id", is(masterProduct.getId())))
                .andExpect(jsonPath("$.total_elements", is(1)));
    }

    @Test
    void getMasterProductSearch_returnsMatchingProducts() throws Exception {
        mockMvc.perform(get("/api/admin/products/search").param("q", "Air"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(masterProduct.getId())))
                .andExpect(jsonPath("$[0].title", is("Nike Air Max 90")))
                .andExpect(jsonPath("$[0].brand", is("Nike")));
    }

    @Test
    void getVariantMatch_returnsSuggestions() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Test")
                .rawVendor("V")
                .status("PENDING")
                .build());
        StagingVariant sv = StagingVariant.builder()
                .rawSku("SKU-1")
                .rawBarcode("1234567890123")
                .build();
        sp.addVariant(sv);
        sp = stagingProductRepository.save(sp);
        Integer stagingVariantId = sp.getVariants().get(0).getId();

        mockMvc.perform(get("/api/admin/review/{stagingId}/variants/match", sp.getId())
                        .param("targetMasterId", String.valueOf(masterProduct.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staging_product_id", is(sp.getId())))
                .andExpect(jsonPath("$.master_product_id", is(masterProduct.getId())))
                .andExpect(jsonPath("$.matches", hasSize(1)))
                .andExpect(jsonPath("$.matches[0].staging_variant_id", is(stagingVariantId)))
                .andExpect(jsonPath("$.matches[0].match_reason").exists());
    }

    @Test
    void postDecision_reject_updatesStagingProduct() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Fake Item")
                .rawVendor("V")
                .status("NEEDS_REVIEW")
                .build());

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_REJECT);
        req.setRejectionReason("Fake Product");
        req.setAdminNotes("Counterfeit.");

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        StagingProduct updated = stagingProductRepository.findById(sp.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("REJECTED", updated.getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("Fake Product", updated.getRejectionReason());
        org.junit.jupiter.api.Assertions.assertEquals("Counterfeit.", updated.getAdminNotes());
    }

    @Test
    void postDecision_createNew_createsMasterProductAndOffers() throws Exception {
        StagingProduct sp = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("New Sneakers")
                .rawVendor("Nike")
                .status("PENDING")
                .build());
        StagingVariant sv = StagingVariant.builder()
                .rawSku("NEW-SKU")
                .rawPriceMinor(9999L)
                .build();
        sp.addVariant(sv);
        stagingProductRepository.save(sp);

        ReviewDecisionRequest req = new ReviewDecisionRequest();
        req.setAction(ReviewDecisionRequest.ACTION_CREATE_NEW);
        ReviewDecisionRequest.CleanDataDto cleanData = new ReviewDecisionRequest.CleanDataDto();
        cleanData.setTitle("Nike New Sneakers - Men's");
        cleanData.setDescription("Description");
        cleanData.setBrandId(brand.getId());
        cleanData.setCategoryId(1);
        // Set any other required fields here if needed
        req.setCleanData(cleanData);

        mockMvc.perform(post("/api/admin/review/{stagingId}/decision", sp.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        StagingProduct updated = stagingProductRepository.findById(sp.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("APPROVED", updated.getStatus());

        long productCount = productRepository.count();
        org.junit.jupiter.api.Assertions.assertTrue(productCount >= 2); // existing + new
        long offerCount = merchantOfferRepository.count();
        org.junit.jupiter.api.Assertions.assertEquals(1, offerCount);
    }
}
