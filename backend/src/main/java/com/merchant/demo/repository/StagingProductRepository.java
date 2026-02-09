// backend/src/main/java/com/merchant/demo/repository/StagingProductRepository.java
package com.merchant.demo.repository;

import com.merchant.demo.entity.StagingProduct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StagingProductRepository extends JpaRepository<StagingProduct, Integer> {

    Optional<StagingProduct> findByMerchantIdAndExternalProductId(Integer merchantId, String externalProductId);

    void deleteAllByMerchantId(Integer merchantId);

    List<StagingProduct> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);

    Page<StagingProduct> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId, Pageable pageable);

    List<StagingProduct> findByMerchantIdAndStatusOrderByUpdatedAtDesc(Integer merchantId, String status);

    Page<StagingProduct> findByMerchantIdAndStatusOrderByUpdatedAtDesc(Integer merchantId, String status, Pageable pageable);

    @Query("SELECT DISTINCT p FROM StagingProduct p LEFT JOIN p.variants v " +
           "WHERE p.merchantId = :merchantId AND (" +
           "LOWER(p.rawTitle) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawVendor) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawProductType) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(v.rawSku) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')))")
    Page<StagingProduct> searchByMerchantId(@Param("merchantId") Integer merchantId, @Param("q") String q, Pageable pageable);

    long countByMerchantIdAndStatusIn(Integer merchantId, List<String> statuses);

    long countByMerchantIdAndStatus(Integer merchantId, String status);

    Page<StagingProduct> findByStatusInOrderByCreatedAtAsc(List<String> statuses, Pageable pageable);

    long countByStatusAndUpdatedAtAfter(String status, Instant after);
}