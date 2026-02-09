package com.merchant.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyncResultDto {
    private String message;
    private int productsSynced;
    private int variantsSynced;
}