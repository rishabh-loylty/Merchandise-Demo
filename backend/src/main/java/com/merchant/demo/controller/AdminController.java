package com.merchant.demo.controller;

import com.merchant.demo.dto.admin.*;
import com.merchant.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/review/{stagingId}")
    public ResponseEntity<StagingDetailDto> getStagingDetail(@PathVariable Integer stagingId) {
        try {
            return ResponseEntity.ok(adminService.getStagingDetail(stagingId));
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/queue")
    public ResponseEntity<ReviewQueuePageDto> getQueue(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getQueue(status, pageable));
    }

    @GetMapping("/brands")
    public ResponseEntity<java.util.List<BrandListItemDto>> listBrands() {
        return ResponseEntity.ok(adminService.listBrands());
    }

    @GetMapping("/categories")
    public ResponseEntity<java.util.List<CategoryListItemDto>> listCategories() {
        return ResponseEntity.ok(adminService.listCategories());
    }

    @GetMapping("/products/{productId}/variants")
    public ResponseEntity<java.util.List<MasterVariantDto>> getProductVariants(@PathVariable Integer productId) {
        try {
            return ResponseEntity.ok(adminService.getProductVariants(productId));
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/products/search")
    public ResponseEntity<java.util.List<MasterProductSearchDto>> searchProducts(
            @RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(adminService.searchMasterProducts(q));
    }

    @GetMapping("/review/{stagingId}/variants/match")
    public ResponseEntity<VariantMatchResponseDto> getVariantMatch(
            @PathVariable Integer stagingId,
            @RequestParam(name = "targetMasterId") Integer targetMasterId) {
        try {
            return ResponseEntity.ok(adminService.getVariantMatchSuggestions(stagingId, targetMasterId));
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @GetMapping("/products")
    public ResponseEntity<org.springframework.data.domain.Page<MasterProductListItemDto>> getMasterProducts(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getMasterProducts(pageable));
    }

    @PatchMapping("/products/{productId}")
    public ResponseEntity<Void> updateMasterProduct(
            @PathVariable Integer productId,
            @RequestBody UpdateMasterProductRequest request) {
        try {
            adminService.updateMasterProduct(productId, request);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    @PostMapping("/review/{stagingId}/decision")
    public ResponseEntity<Void> submitDecision(
            @PathVariable Integer stagingId,
            @RequestBody ReviewDecisionRequest request) {
        try {
            adminService.submitDecision(stagingId, request);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
