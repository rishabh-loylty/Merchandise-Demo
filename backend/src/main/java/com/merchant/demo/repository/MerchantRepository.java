package com.merchant.demo.repository;

import com.merchant.demo.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MerchantRepository extends JpaRepository<Merchant, Integer> {
    List<Merchant> findByIsActiveTrueOrderByName();
}