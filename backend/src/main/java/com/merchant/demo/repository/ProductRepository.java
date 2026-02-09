package com.merchant.demo.repository;

import com.merchant.demo.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    @Query("SELECT p FROM Product p WHERE LOWER(p.title) LIKE LOWER(CONCAT(CONCAT('%', :q), '%'))")
    Page<Product> searchByTitle(@Param("q") String q, Pageable pageable);
}
