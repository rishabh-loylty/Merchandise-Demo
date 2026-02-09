package com.merchant.demo.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.dto.admin.ReviewDecisionRequest;
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

    private Merchant merchant;
    private Brand brand;
    private Product masterProduct;
    private Variant masterVariant;

    @BeforeEach
    void setUp() {
        merchantOfferRepository.deleteAll();
        variantRepository.deleteAll();
        productRepository.deleteAll();
        stagingProductRepository.deleteAll();
        merchantRepository.deleteAll();
        brandRepository.deleteAll();

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
        stagingProductRepository.save(sp);

        mockMvc.perform(get("/api/admin/review/{stagingId}/variants/match", sp.getId())
                        .param("targetMasterId", String.valueOf(masterProduct.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.staging_product_id", is(sp.getId())))
                .andExpect(jsonPath("$.master_product_id", is(masterProduct.getId())))
                .andExpect(jsonPath("$.matches", hasSize(1)))
                .andExpect(jsonPath("$.matches[0].staging_variant_id", is(sv.getId())))
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
        req.setCleanData(new ReviewDecisionRequest.CleanDataDto(
                "Nike New Sneakers - Men's",
                "Description",
                brand.getId(),
                1
        ));

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
