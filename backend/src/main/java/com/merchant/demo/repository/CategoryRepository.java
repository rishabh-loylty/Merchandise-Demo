package com.merchant.demo.repository;

import com.merchant.demo.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Integer> {

    List<Category> findByParentIdIsNullOrderByNameAsc();

    List<Category> findByParentIdOrderByNameAsc(Integer parentId);
}
