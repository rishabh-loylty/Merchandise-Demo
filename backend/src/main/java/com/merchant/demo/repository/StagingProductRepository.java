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
    /*
    SELECT * 
    FROM staging_products 
    WHERE merchant_id = ? AND external_product_id = ?;
    */
    Optional<StagingProduct> findByMerchantIdAndExternalProductId(Integer merchantId, String externalProductId);

    /*
    SELECT id FROM staging_products WHERE merchant_id = ?;
    DELETE FROM staging_variants WHERE staging_product_id = ?;
    */
    void deleteAllByMerchantId(Integer merchantId);

    /*
    SELECT * 
    FROM staging_products 
    WHERE merchant_id = ? 
    ORDER BY created_at DESC;
    */
    List<StagingProduct> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);

    /*
    SELECT * 
    FROM staging_products 
    WHERE merchant_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?;

    and 

    SELECT count(id) FROM staging_products WHERE merchant_id = ?;
    */
    Page<StagingProduct> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId, Pageable pageable);

    /*
    SELECT * 
    FROM staging_products 
    WHERE merchant_id = ? AND status = ? 
    ORDER BY updated_at DESC 
    [LIMIT ? OFFSET ?]; -- Only if Pageable is provided
    */
    List<StagingProduct> findByMerchantIdAndStatusOrderByUpdatedAtDesc(Integer merchantId, String status);

    Page<StagingProduct> findByMerchantIdAndStatusOrderByUpdatedAtDesc(Integer merchantId, String status, Pageable pageable);

    @Query("SELECT DISTINCT p FROM StagingProduct p LEFT JOIN p.variants v " +
           "WHERE p.merchantId = :merchantId AND (" +
           "LOWER(p.rawTitle) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawVendor) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawProductType) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(v.rawSku) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')))")
    Page<StagingProduct> searchByMerchantId(@Param("merchantId") Integer merchantId, @Param("q") String q, Pageable pageable);

    @Query("SELECT DISTINCT p FROM StagingProduct p LEFT JOIN p.variants v " +
           "WHERE p.merchantId = :merchantId AND p.status IN :statuses AND (" +
           "LOWER(p.rawTitle) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawVendor) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(p.rawProductType) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')) OR " +
           "LOWER(v.rawSku) LIKE LOWER(CONCAT(CONCAT('%', :q), '%')))")
    Page<StagingProduct> searchByMerchantIdAndStatusIn(
        @Param("merchantId") Integer merchantId, 
        @Param("statuses") List<String> statuses, 
        @Param("q") String q, 
        Pageable pageable);

    /*
    SELECT count(id) 
    FROM staging_products 
    WHERE merchant_id = ? AND status IN (?, ?, ...);
    */
    long countByMerchantIdAndStatusIn(Integer merchantId, List<String> statuses);

    /*
    SELECT count(id) 
    FROM staging_products 
    WHERE merchant_id = ? AND status = ?;
    */
    long countByMerchantIdAndStatus(Integer merchantId, String status);

    /*
    SELECT * 
    FROM staging_products 
    WHERE status IN (?, ?, ...) 
    ORDER BY created_at ASC 
    LIMIT ? OFFSET ?;
    */
    Page<StagingProduct> findByStatusInOrderByCreatedAtAsc(List<String> statuses, Pageable pageable);

    /* 
    SELECT count(id) 
    FROM staging_products 
    WHERE status = ? AND updated_at > ?;
    */
    long countByStatusAndUpdatedAtAfter(String status, Instant after);

    /*
    SELECT 
        id, merchant_id, external_product_id, raw_title, raw_body_html, 
        raw_vendor, raw_product_type, raw_tags, raw_json_dump, status, 
        match_confidence_score, suggested_product_id, admin_notes, 
        rejection_reason, created_at, updated_at, raw_options_definition
    FROM staging_products
    WHERE merchant_id = ? 
    AND status IN (?, ?, ?, ...)
    -- If your Pageable includes sorting:
    ORDER BY created_at DESC 
    -- The pagination part:
    LIMIT ? OFFSET ?;
    */
    Page<StagingProduct> findByMerchantIdAndStatusIn(Integer merchantId, List<String> statuses, Pageable pageable);
}