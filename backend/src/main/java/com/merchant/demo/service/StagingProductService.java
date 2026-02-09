package com.merchant.demo.service;

import com.merchant.demo.dto.DashboardStatsDto;
import com.merchant.demo.dto.IssueProductDto;
import com.merchant.demo.dto.StagingProductListItemDto;
import com.merchant.demo.entity.StagingProduct;
import com.merchant.demo.repository.MerchantRepository;
import com.merchant.demo.repository.StagingProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StagingProductService {

    private static final Set<String> UNDER_REVIEW_STATUSES = Set.of(
            "PENDING", "PENDING_SYNC", "PROCESSING", "AUTO_MATCHED", "NEEDS_REVIEW");

    private final MerchantRepository merchantRepository;
    private final StagingProductRepository stagingProductRepository;

    @Transactional(readOnly = true)
    public List<StagingProductListItemDto> getStagingForMerchant(Integer merchantId) {
        ensureMerchantExists(merchantId);
        List<StagingProduct> list = stagingProductRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        return list.stream().map(this::toStagingListItem).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueProductDto> getIssuesForMerchant(Integer merchantId) {
        ensureMerchantExists(merchantId);
        List<StagingProduct> list = stagingProductRepository.findByMerchantIdAndStatusOrderByUpdatedAtDesc(merchantId, "REJECTED");
        return list.stream().map(this::toIssueDto).collect(Collectors.toList());
    }

    @Transactional
    public void resyncStagingProduct(Integer merchantId, Integer stagingId) {
        ensureMerchantExists(merchantId);
        StagingProduct staging = stagingProductRepository.findById(stagingId)
                .orElseThrow(() -> new NoSuchElementException("Staging product not found: " + stagingId));
        if (!staging.getMerchantId().equals(merchantId)) {
            throw new NoSuchElementException("Staging product not found: " + stagingId);
        }
        staging.setStatus("PENDING_SYNC");
        stagingProductRepository.save(staging);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getStatsForMerchant(Integer merchantId) {
        ensureMerchantExists(merchantId);
        List<StagingProduct> all = stagingProductRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        long underReview = all.stream().filter(p -> UNDER_REVIEW_STATUSES.contains(p.getStatus())).count();
        long issues = all.stream().filter(p -> "REJECTED".equals(p.getStatus())).count();
        long liveProducts = 0L; // TODO: when MerchantOffer repo exists
        long totalSkus = underReview + issues + liveProducts;
        return DashboardStatsDto.builder()
                .liveProducts(liveProducts)
                .underReview(underReview)
                .issues(issues)
                .totalSkus(totalSkus)
                .build();
    }

    private void ensureMerchantExists(Integer merchantId) {
        if (!merchantRepository.existsById(merchantId)) {
            throw new NoSuchElementException("Merchant not found: " + merchantId);
        }
    }

    private StagingProductListItemDto toStagingListItem(StagingProduct p) {
        String imageUrl = p.getMedia() != null && !p.getMedia().isEmpty()
                ? p.getMedia().get(0).getSourceUrl()
                : null;
        return StagingProductListItemDto.builder()
                .id(p.getId())
                .title(p.getRawTitle())
                .vendor(p.getRawVendor())
                .productType(p.getRawProductType())
                .createdAt(p.getCreatedAt())
                .imageUrl(imageUrl)
                .status(p.getStatus())
                .build();
    }

    private IssueProductDto toIssueDto(StagingProduct p) {
        String imageUrl = p.getMedia() != null && !p.getMedia().isEmpty()
                ? p.getMedia().get(0).getSourceUrl()
                : null;
        return IssueProductDto.builder()
                .id(p.getId())
                .title(p.getRawTitle())
                .vendor(p.getRawVendor())
                .rejectedAt(p.getUpdatedAt())
                .rejectionReason(p.getRejectionReason())
                .imageUrl(imageUrl)
                .build();
    }
}
