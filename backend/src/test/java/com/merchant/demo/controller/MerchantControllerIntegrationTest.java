package com.merchant.demo.controller;

import com.merchant.demo.dto.SyncResultDto;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
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

    @MockitoBean
    private ProductSyncService productSyncService;

    @BeforeEach
    void setUp() {
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
}