// backend/src/main/java/com/merchant/demo/repository/StagingProductRepository.java
package com.merchant.demo.repository;

import com.merchant.demo.entity.StagingProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StagingProductRepository extends JpaRepository<StagingProduct, Integer> {

    Optional<StagingProduct> findByMerchantIdAndExternalProductId(Integer merchantId, String externalProductId);

    void deleteAllByMerchantId(Integer merchantId);

    List<StagingProduct> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);

    List<StagingProduct> findByMerchantIdAndStatusOrderByUpdatedAtDesc(Integer merchantId, String status);
}