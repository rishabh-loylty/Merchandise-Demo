package com.merchant.demo.controller;

import com.merchant.demo.dto.CreateMerchantRequest;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantRepository merchantRepository;

    @GetMapping
    public ResponseEntity<List<Merchant>> getAllMerchants() {
        List<Merchant> merchants = merchantRepository.findByIsActiveTrueOrderByName();
        return ResponseEntity.ok(merchants);
    }

    @PostMapping
    public ResponseEntity<Merchant> createMerchant(@Valid @RequestBody CreateMerchantRequest request) {
        Merchant newMerchant = Merchant.builder()
                .name(request.getName())
                .email(request.getEmail())
                .build();

        Merchant savedMerchant = merchantRepository.save(newMerchant);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedMerchant);
    }
}