package com.merchant.demo.controller;

import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
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
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
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
}