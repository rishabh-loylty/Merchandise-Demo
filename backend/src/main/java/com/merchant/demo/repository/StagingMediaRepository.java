package com.merchant.demo.repository;

import com.merchant.demo.entity.StagingMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StagingMediaRepository extends JpaRepository<StagingMedia, Integer> {

    List<StagingMedia> findByIdInAndStagingProduct_Id(List<Integer> ids, Integer stagingProductId);

    List<StagingMedia> findByStagingProduct_IdOrderByPositionAsc(Integer stagingProductId);
}
