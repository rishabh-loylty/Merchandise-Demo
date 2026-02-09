package com.merchant.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.adapter.ShopifyAdapter;
import com.merchant.demo.dto.ShopifyConfig;
import com.merchant.demo.dto.SyncResultDto;
import com.merchant.demo.dto.shopify.*;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
import com.merchant.demo.repository.StagingProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductSyncServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @Mock
    private StagingProductRepository stagingProductRepository;

    @Mock
    private ShopifyAdapter shopifyAdapter;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ProductSyncService productSyncService;

    private static ProductNode productNode(String id, String title, int variantCount) {
        List<VariantConnection.VariantEdge> edges = java.util.stream.IntStream.range(0, variantCount)
                .mapToObj(i -> new VariantConnection.VariantEdge(
                        new VariantNode("vid-" + i, "sku-" + i, null, "10.00", List.of())))
                .toList();
        return new ProductNode(
                id, title, "...", "Vendor", "Type",
                List.of(), List.of(),
                new VariantConnection(edges),
                null
        );
    }

    @Test
    void syncProductsForMerchant_whenMerchantExists_fetchesAndSavesProducts() {
        Integer merchantId = 1;
        String sourceConfigJson = "{\"store_url\":\"my-store.myshopify.com\",\"access_token\":\"shpat_test_token\"}";
        Merchant mockMerchant = Merchant.builder().id(merchantId).sourceConfig(sourceConfigJson).build();

        List<ProductNode> mockProducts = List.of(
                productNode("gid://shopify/Product/1", "Test Product 1", 1),
                productNode("gid://shopify/Product/2", "Test Product 2", 2)
        );

        when(merchantRepository.findById(merchantId)).thenReturn(Optional.of(mockMerchant));
        when(shopifyAdapter.fetchAllProducts(any(ShopifyConfig.class))).thenReturn(mockProducts);
        when(stagingProductRepository.findByMerchantIdAndExternalProductId(anyInt(), anyString())).thenReturn(Optional.empty());

        SyncResultDto result = productSyncService.syncProductsForMerchant(merchantId);

        assertThat(result.getProductsSynced()).isEqualTo(2);
        assertThat(result.getVariantsSynced()).isEqualTo(3);

        verify(stagingProductRepository, times(2)).save(any());
    }
}
