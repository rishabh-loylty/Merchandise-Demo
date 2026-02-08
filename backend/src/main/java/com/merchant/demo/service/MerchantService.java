package com.merchant.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.dto.CreateMerchantRequest;
import com.merchant.demo.dto.UpdateMerchantRequest;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final ObjectMapper objectMapper;

    // Read-only transaction for performance
    @Transactional(readOnly = true)
    public List<Merchant> getAllActiveMerchants() {
        return merchantRepository.findByIsActiveTrueOrderByName();
    }

    @Transactional
    public Merchant createMerchant(CreateMerchantRequest request) {
        Merchant newMerchant = Merchant.builder()
                .name(request.getName())
                .email(request.getEmail())
                // Defaults (is_active, etc.) are handled by Entity @Builder.Default
                .build();

        return merchantRepository.save(newMerchant);
    }

    @Transactional
    public Merchant updateMerchant(Integer id, UpdateMerchantRequest request) {
        // 1. Fetch
        Merchant merchant = merchantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Merchant with ID " + id + " not found"));

        // 2. Update Fields (Dirty Checking will save changes at end of transaction)
        if (request.getName() != null) {
            merchant.setName(request.getName());
        }

        if (request.getShopifyConfigured() != null) {
            merchant.setShopifyConfigured(request.getShopifyConfigured());
        }

        if (request.getSourceConfig() != null) {
            try {
                String jsonString = objectMapper.writeValueAsString(request.getSourceConfig());
                merchant.setSourceConfig(jsonString);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Error processing JSON config", e);
            }
        }

        // 3. Save (Explicit save is good practice, though JPA does it automatically in @Transactional)
        return merchantRepository.save(merchant);
    }
}