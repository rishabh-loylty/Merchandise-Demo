package com.merchant.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.merchant.demo.dto.UpdateMerchantRequest;
import com.merchant.demo.entity.Merchant;
import com.merchant.demo.repository.MerchantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MerchantServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private MerchantService merchantService;

    @Test
    void updateMerchant_ShouldUpdateName_WhenFound() {
        // Arrange
        Integer id = 1;
        Merchant existing = Merchant.builder().id(id).name("Old").build();
        UpdateMerchantRequest request = new UpdateMerchantRequest();
        request.setName("New");

        when(merchantRepository.findById(id)).thenReturn(Optional.of(existing));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        Merchant result = merchantService.updateMerchant(id, request);

        // Assert
        assertEquals("New", result.getName());
        verify(merchantRepository).save(existing);
    }
}