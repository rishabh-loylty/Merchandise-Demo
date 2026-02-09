package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MediaConnection(List<MediaEdge> edges) {
    public record MediaEdge(MediaNode node) {}

    public record MediaNode(
            String id,
            String mediaContentType,
            String alt,
            MediaImage image,
            MediaPreview preview
    ) {}

    public record MediaImage(String url, String altText) {}

    public record MediaPreview(MediaImage image) {}
}
