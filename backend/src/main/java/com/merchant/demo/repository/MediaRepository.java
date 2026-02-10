package com.merchant.demo.repository;

import com.merchant.demo.entity.Media;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaRepository extends JpaRepository<Media, Integer> {

    List<Media> findByProductIdOrderByPositionAsc(Integer productId);
}
