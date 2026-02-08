package com.merchant.demo.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class CreateMerchantRequest {
    @NotEmpty(message = "Name is required")
    private String name;

    @NotEmpty(message = "Email is required")
    private String email;
}