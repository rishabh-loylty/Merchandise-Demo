package com.merchant.demo.repository;

import com.merchant.demo.entity.MerchantOffer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MerchantOfferRepository extends JpaRepository<MerchantOffer, Integer> {

    boolean existsByMerchantIdAndVariantId(Integer merchantId, Integer variantId);
}
