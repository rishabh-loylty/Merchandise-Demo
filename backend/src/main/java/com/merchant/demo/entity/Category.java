package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "parent_id")
    private Integer parentId;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String slug;
    private String icon;
    private String path;
    @Column(name = "is_active")
    private Boolean isActive;
}
