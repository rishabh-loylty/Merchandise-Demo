package com.merchant.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "staging_media")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "stagingProduct")
public class StagingMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staging_product_id", nullable = false)
    private StagingProduct stagingProduct;

    @Column(name = "external_media_id")
    private String externalMediaId;

    @Column(name = "media_type")
    private String mediaType;

    @Column(name = "source_url", nullable = false)
    private String sourceUrl;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "position")
    private Integer position;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}