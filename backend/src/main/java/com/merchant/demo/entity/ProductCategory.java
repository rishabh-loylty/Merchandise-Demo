package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "product_categories")
@IdClass(ProductCategory.ProductCategoryId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategory {

    @Id
    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Id
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductCategoryId implements Serializable {
        private Integer productId;
        private Integer categoryId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof ProductCategoryId that)) return false;
            return Objects.equals(productId, that.productId) && Objects.equals(categoryId, that.categoryId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(productId, categoryId);
        }
    }
}
