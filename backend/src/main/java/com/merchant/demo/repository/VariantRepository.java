package com.merchant.demo.repository;

import com.merchant.demo.entity.Variant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VariantRepository extends JpaRepository<Variant, Integer> {

    List<Variant> findByProductId(Integer productId);

    List<Variant> findByGtin(String gtin);

    List<Variant> findByProductIdAndInternalSku(Integer productId, String internalSku);
}
