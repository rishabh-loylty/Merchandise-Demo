package com.merchant.demo.controller;

import com.merchant.demo.dto.CreateMerchantRequest;
import com.merchant.demo.dto.UpdateMerchantRequest;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.service.MerchantService; // Import Service
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    @GetMapping
    public ResponseEntity<List<Merchant>> getAllMerchants() {
        return ResponseEntity.ok(merchantService.getAllActiveMerchants());
    }

    @PostMapping
    public ResponseEntity<Merchant> createMerchant(@Valid @RequestBody CreateMerchantRequest request) {
        Merchant created = merchantService.createMerchant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{merchantId}")
    public ResponseEntity<Merchant> updateMerchant(
            @PathVariable Integer merchantId,
            @RequestBody UpdateMerchantRequest request) {
        
        // Validation logic stays in Controller (or a Validator class)
        if (request.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            Merchant updated = merchantService.updateMerchant(merchantId, request);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            // Translate Service exceptions to HTTP Status codes
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating merchant");
        }
    }
}