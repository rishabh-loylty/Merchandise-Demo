// backend/src/main/java/com/merchant/demo/repository/StagingProductRepository.java
package com.merchant.demo.repository;

import com.merchant.demo.entity.StagingProduct;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StagingProductRepository extends JpaRepository<StagingProduct, Integer> {

    // Find specific product for a merchant
    Optional<StagingProduct> findByMerchantIdAndExternalProductId(Integer merchantId, String externalProductId);
    
    // Kept for utility, but we aren't using it in the smart sync anymore
    void deleteAllByMerchantId(Integer merchantId);
}