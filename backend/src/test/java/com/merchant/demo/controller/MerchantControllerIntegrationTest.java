package com.merchant.demo.controller;

import com.merchant.demo.dto.SyncResultDto;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.entity.StagingProduct;
import com.merchant.demo.repository.MerchantRepository;
import com.merchant.demo.repository.StagingProductRepository;
import com.merchant.demo.service.ProductSyncService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class MerchantControllerIntegrationTest {

    // Starts a Postgres container matching your specific version
    private static final DockerImageName POSTGRES_IMAGE = DockerImageName.parse("postgres:16"); // Or another version
    
    @Container
    @ServiceConnection
    private static final PostgreSQLContainer postgres = new PostgreSQLContainer(POSTGRES_IMAGE);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private StagingProductRepository stagingProductRepository;

    @MockitoBean
    private ProductSyncService productSyncService;

    @BeforeEach
    void setUp() {
        stagingProductRepository.deleteAll();
        merchantRepository.deleteAll();
    }

    @Test
    void getAllMerchants_ShouldReturnActiveMerchants_OrderedByName() throws Exception {
        // Arrange
        merchantRepository.save(Merchant.builder().name("Zara").email("zara@test.com").isActive(true).build());
        merchantRepository.save(Merchant.builder().name("Adidas").email("adidas@test.com").isActive(true).build());
        merchantRepository.save(Merchant.builder().name("InactiveStore").isActive(false).build());

        // Act & Assert
        // Logic: Should only return 2 (Active ones), Ordered: Adidas first, then Zara
        mockMvc.perform(get("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].name", is("Adidas")))
                .andExpect(jsonPath("$[1].name", is("Zara")));
    }

    @Test
    void createMerchant_ShouldCreateAndReturnMerchant() throws Exception {
        // Arrange
        String jsonRequest = """
            {
                "name": "Nike",
                "email": "nike@test.com"
            }
        """;

        // Act & Assert
        mockMvc.perform(post("/api/merchants")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Nike")))
                .andExpect(jsonPath("$.sourceType", is("SHOPIFY"))) // Default from Entity
                .andExpect(jsonPath("$.shopifyConfigured", is(false))); // Default from Entity
    }

    @Test
    void patchMerchant_ShouldUpdateProvidedFields_AndUpdatedAt() throws Exception {
        // Arrange: Create a merchant
        Merchant saved = merchantRepository.save(Merchant.builder()
                .name("Old Name")
                .email("patch@test.com")
                .shopifyConfigured(false)
                .sourceConfig("{}")
                .isActive(true)
                .build());

        String merchantId = saved.getId().toString();
        
        String jsonRequest = """
            {
                "name": "New Name",
                "shopify_configured": true,
                "source_config": { "shopUrl": "test.myshopify.com" }
            }
        """;

        // Act
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/merchants/" + merchantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                // Assert
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("New Name")))
                .andExpect(jsonPath("$.shopifyConfigured", is(true)))
                // Verify DB update
                .andDo(result -> {
                    Merchant updated = merchantRepository.findById(saved.getId()).orElseThrow();
                    org.junit.jupiter.api.Assertions.assertEquals("New Name", updated.getName());
                    org.junit.jupiter.api.Assertions.assertTrue(updated.getShopifyConfigured());
                    // Check if updateTimestamp changed
                    org.junit.jupiter.api.Assertions.assertTrue(updated.getUpdatedAt().isAfter(saved.getCreatedAt()));
                });
    }

    @Test
    void patchMerchant_ShouldReturn404_WhenMerchantNotFound() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/merchants/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Ghost\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchMerchant_ShouldReturn400_WhenNoFieldsToUpdate() throws Exception {
         // Arrange
        Merchant saved = merchantRepository.save(Merchant.builder().name("Exists").email("e@e.com").build());

        // Act: Empty JSON body
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/merchants/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void syncMerchantProducts_whenCalled_returnsSyncResult() throws Exception {
        // Arrange
        Integer merchantId = 1;
        SyncResultDto mockResult = new SyncResultDto("Sync completed successfully", 10, 50);

        when(productSyncService.syncProductsForMerchant(merchantId)).thenReturn(mockResult);

        // Act & Assert
        mockMvc.perform(post("/api/merchants/{merchantId}/sync", merchantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Sync completed successfully"))
                .andExpect(jsonPath("$.productsSynced").value(10));
    }

    // --- Merchant Operations: staging, issues, resync (TDD) ---

    @Test
    void getStaging_returnsPaginatedStagingProductsForMerchant() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Nike Air Max")
                .rawVendor("Nike")
                .rawProductType("Shoes")
                .status("PENDING")
                .build());
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Puma Jacket")
                .rawVendor("Puma")
                .rawProductType("Apparel")
                .status("NEEDS_REVIEW")
                .build());

        mockMvc.perform(get("/api/merchants/{id}/staging", merchant.getId()).param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.content[*].title").value(org.hamcrest.Matchers.hasItems("Nike Air Max", "Puma Jacket")))
                .andExpect(jsonPath("$.content[*].vendor").value(org.hamcrest.Matchers.hasItems("Nike", "Puma")))
                .andExpect(jsonPath("$.content[0].id").exists())
                .andExpect(jsonPath("$.content[0].productType").exists())
                .andExpect(jsonPath("$.content[0].status").exists())
                .andExpect(jsonPath("$.content[0].createdAt").exists());
    }

    @Test
    void getStaging_returns404_whenMerchantNotFound() throws Exception {
        mockMvc.perform(get("/api/merchants/99999/staging"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getIssues_returnsPaginatedRejectedStagingProducts() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        StagingProduct rejected = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Reebok T-Shirt")
                .rawVendor("Reebok")
                .status("REJECTED")
                .rejectionReason("Image resolution too low")
                .build());

        mockMvc.perform(get("/api/merchants/{id}/issues", merchant.getId()).param("page", "0").param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements", is(1)))
                .andExpect(jsonPath("$.content[0].id", is(rejected.getId())))
                .andExpect(jsonPath("$.content[0].title", is("Reebok T-Shirt")))
                .andExpect(jsonPath("$.content[0].vendor", is("Reebok")))
                .andExpect(jsonPath("$.content[0].rejectionReason", is("Image resolution too low")))
                .andExpect(jsonPath("$.content[0].rejectedAt").exists());
    }

    @Test
    void postResync_setsStatusToPendingSync() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        StagingProduct staging = stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Item")
                .rawVendor("V")
                .status("REJECTED")
                .build());

        mockMvc.perform(post("/api/merchants/{id}/products/{stagingId}/resync", merchant.getId(), staging.getId()))
                .andExpect(status().isOk());

        StagingProduct updated = stagingProductRepository.findById(staging.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("PENDING_SYNC", updated.getStatus());
    }

    @Test
    void getStats_returnsAggregatedCounts() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        stagingProductRepository.save(StagingProduct.builder().merchantId(merchant.getId()).rawTitle("A").rawVendor("V").status("PENDING").build());
        stagingProductRepository.save(StagingProduct.builder().merchantId(merchant.getId()).rawTitle("B").rawVendor("V").status("NEEDS_REVIEW").build());
        stagingProductRepository.save(StagingProduct.builder().merchantId(merchant.getId()).rawTitle("C").rawVendor("V").status("REJECTED").build());

        mockMvc.perform(get("/api/merchants/{id}/stats", merchant.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.underReview", is(2)))
                .andExpect(jsonPath("$.issues", is(1)))
                .andExpect(jsonPath("$.liveProducts").exists())
                .andExpect(jsonPath("$.totalSkus").exists());
    }

    // --- Search (TDD) ---

    @Test
    void search_returnsMatchingStagingProductsPaginated() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Nike Air Max")
                .rawVendor("Nike")
                .rawProductType("Shoes")
                .status("PENDING")
                .build());
        stagingProductRepository.save(StagingProduct.builder()
                .merchantId(merchant.getId())
                .rawTitle("Puma Jacket")
                .rawVendor("Puma")
                .rawProductType("Apparel")
                .status("PENDING")
                .build());

        mockMvc.perform(get("/api/merchants/{id}/search", merchant.getId())
                        .param("q", "Nike")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("Nike Air Max")))
                .andExpect(jsonPath("$.totalElements", is(1)));
    }

    @Test
    void search_returns404_whenMerchantNotFound() throws Exception {
        mockMvc.perform(get("/api/merchants/99999/search").param("q", "test"))
                .andExpect(status().isNotFound());
    }

    @Test
    void search_emptyQuery_returnsAllStagingPaginated() throws Exception {
        Merchant merchant = merchantRepository.save(Merchant.builder().name("Store").email("s@t.com").isActive(true).build());
        stagingProductRepository.save(StagingProduct.builder().merchantId(merchant.getId()).rawTitle("A").rawVendor("V").status("PENDING").build());

        mockMvc.perform(get("/api/merchants/{id}/search", merchant.getId()).param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("A")));
    }
}