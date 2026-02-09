package com.merchant.demo.dto.shopify;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductNode(
    String id,
    String title,
    String descriptionHtml,
    String vendor,
    String productType,
    List<String> tags,
    List<OptionNode> options,
    VariantConnection variants,
    MediaConnection media
) {}
